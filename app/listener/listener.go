package main

import (
	"context"
	"flag"
	"log"
	"math/big"
	"os"
	"strings"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/wwater/course-dao/app/listener/config"
	"github.com/zeromicro/go-zero/core/conf"
)

var (
	configFile = flag.String("f", "etc/listener.yaml", "the config file")

	// 勋章 Transfer 事件固定哈希
	sigTransfer = common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")

	// OpenZeppelin Governor 动态哈希
	sigProposalCreated  common.Hash
	sigVoteCast         common.Hash
	sigProposalExecuted common.Hash
)

func main() {
	flag.Parse()
	var c config.Config
	conf.MustLoad(*configFile, &c)

	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr:        c.ClickHouse.Addr,
		Auth:        clickhouse.Auth{Database: c.ClickHouse.Database, Username: c.ClickHouse.Username, Password: c.ClickHouse.Password},
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		log.Fatalf("ClickHouse 失败: %v", err)
	}

	// 建立 WebSocket 连接
	client, err := ethclient.Dial(c.Eth.WSRpc)
	if err != nil {
		log.Fatalf("Eth 失败: %v", err)
	}

	// 加载 ABI
	medalAbiContent, _ := os.ReadFile(c.Eth.MedalABIPath)
	medalAbi, _ := abi.JSON(strings.NewReader(string(medalAbiContent)))

	vaultAbiContent, _ := os.ReadFile(c.Eth.VaultABIPath)
	vaultAbi, _ := abi.JSON(strings.NewReader(string(vaultAbiContent)))

	// 初始化哈希
	sigProposalCreated = vaultAbi.Events["ProposalCreated"].ID
	sigVoteCast = vaultAbi.Events["VoteCast"].ID
	sigProposalExecuted = vaultAbi.Events["ProposalExecuted"].ID

	medalAddr := common.HexToAddress(c.Eth.ContractAddress)
	vaultAddr := common.HexToAddress(c.Eth.VaultAddress)

	header, _ := client.HeaderByNumber(context.Background(), nil)
	currentBlock := header.Number.Uint64()
	batchSize := uint64(10)

	// 实时监听
	query := ethereum.FilterQuery{
		Addresses: []common.Address{medalAddr, vaultAddr},
		Topics:    [][]common.Hash{{sigTransfer, sigProposalCreated, sigVoteCast, sigProposalExecuted}},
	}

	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatalf("订阅失败: %v", err)
	}
	log.Printf("实时监听已就绪 | 高度: %d", currentBlock)

	// 历史补录
	go func() {
		time.Sleep(1 * time.Second)
		syncHistory(client, conn, medalAddr, uint64(c.Eth.StartBlock), currentBlock, []common.Hash{sigTransfer}, medalAbi, vaultAbi, medalAddr, vaultAddr, batchSize)
	}()

	go func() {
		time.Sleep(2 * time.Second)
		syncHistory(client, conn, vaultAddr, uint64(c.Eth.VaultStartBlock), currentBlock, []common.Hash{sigProposalCreated, sigVoteCast, sigProposalExecuted}, medalAbi, vaultAbi, medalAddr, vaultAddr, batchSize)
	}()

	for {
		select {
		case err := <-sub.Err():
			log.Fatalf("断开连接: %v", err)
		case vLog := <-logs:
			processEvent(client, conn, vLog, medalAddr, vaultAddr, medalAbi, vaultAbi)
		}
	}
}

// syncHistory 同步历史
func syncHistory(client *ethclient.Client, conn clickhouse.Conn, addr common.Address, start, end uint64, topics []common.Hash, mAbi, vAbi abi.ABI, mAddr, vAddr common.Address, batchSize uint64) {
	for from := start; from <= end; {
		to := from + batchSize - 1
		if to > end {
			to = end
		}
		q := ethereum.FilterQuery{
			FromBlock: big.NewInt(int64(from)),
			ToBlock:   big.NewInt(int64(to)),
			Addresses: []common.Address{addr},
			Topics:    [][]common.Hash{topics},
		}
		histLogs, err := client.FilterLogs(context.Background(), q)
		if err != nil {
			time.Sleep(2 * time.Second)
			continue
		}
		for _, l := range histLogs {
			processEvent(client, conn, l, mAddr, vAddr, mAbi, vAbi)
		}
		from += batchSize
		time.Sleep(500 * time.Millisecond)
	}
}

// processEvent 事件处理
func processEvent(client *ethclient.Client, conn clickhouse.Conn, vLog types.Log, medalAddr, vaultAddr common.Address, mAbi, vAbi abi.ABI) {
	ctx := context.Background()
	txHash := vLog.TxHash.Hex()

	// 处理勋章等级逻辑
	if vLog.Address == medalAddr && vLog.Topics[0] == sigTransfer {
		if len(vLog.Topics) < 4 {
			return
		}
		toAddr := strings.ToLower(common.HexToAddress(vLog.Topics[2].Hex()).Hex())
		tokenId := new(big.Int).SetBytes(vLog.Topics[3].Bytes())

		// 回访合约查等级
		data, _ := mAbi.Pack("tokenLevels", tokenId)
		resp, err := client.CallContract(ctx, ethereum.CallMsg{To: &medalAddr, Data: data}, nil)
		var level uint8
		if err == nil {
			mAbi.UnpackIntoInterface(&level, "tokenLevels", resp)
		}

		query := `INSERT INTO course_dao.medal_mint_events (token_id, to_address, level, transaction_hash, block_number, minted_at) VALUES (?, ?, ?, ?, ?, now())`
		_ = conn.Exec(ctx, query, tokenId.Uint64(), toAddr, level, txHash, vLog.BlockNumber)

		names := []string{"Bronze", "Silver", "Gold"}
		log.Printf("- [勋章] #%d [%s] -> %s", tokenId.Uint64(), names[level], toAddr[:8])
	}

	// 治理事件处理
	if vLog.Address == vaultAddr {
		switch vLog.Topics[0] {
		case sigProposalCreated:
			var event struct {
				ProposalId  *big.Int
				Proposer    common.Address
				Targets     []common.Address
				Values      []*big.Int
				Signatures  []string
				Calldatas   [][]byte
				VoteStart   *big.Int
				VoteEnd     *big.Int
				Description string
			}
			if err := vAbi.UnpackIntoInterface(&event, "ProposalCreated", vLog.Data); err == nil {
				amt := "0"
				recv := ""
				if len(event.Values) > 0 {
					amt = event.Values[0].String()
				}
				if len(event.Targets) > 0 {
					recv = event.Targets[0].Hex()
				}
				query := `INSERT INTO course_dao.proposal_created_events (pid, proposer, description, amount, receiver, tx_hash, block_number) VALUES (?, ?, ?, ?, ?, ?, ?)`
				_ = conn.Exec(ctx, query, event.ProposalId.String(), event.Proposer.Hex(), event.Description, amt, recv, txHash, vLog.BlockNumber)
			}
		case sigVoteCast:
			var event struct {
				ProposalId *big.Int
				Support    uint8
				Weight     *big.Int
				Reason     string
			}
			if err := vAbi.UnpackIntoInterface(&event, "VoteCast", vLog.Data); err == nil {
				voter := common.HexToAddress(vLog.Topics[1].Hex()).Hex()
				query := `INSERT INTO course_dao.vote_events (pid, voter, weight, tx_hash, block_number) VALUES (?, ?, ?, ?, ?)`
				_ = conn.Exec(ctx, query, event.ProposalId.String(), voter, event.Weight.String(), txHash, vLog.BlockNumber)
				log.Printf("- [投票] ID:%s | 权重:%s", event.ProposalId.String()[:6], event.Weight.String())
			}
		case sigProposalExecuted:
			var event struct{ ProposalId *big.Int }
			if err := vAbi.UnpackIntoInterface(&event, "ProposalExecuted", vLog.Data); err == nil {
				query := `INSERT INTO course_dao.proposal_executed_events (pid, receiver, amount, tx_hash, block_number) VALUES (?, ?, ?, ?, ?)`
				_ = conn.Exec(ctx, query, event.ProposalId.String(), "", "0", txHash, vLog.BlockNumber)
			}
		}
	}
}
