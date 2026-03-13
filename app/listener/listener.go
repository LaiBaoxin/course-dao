package main

import (
	"context"
	"flag"
	"log"
	"math/big"
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

const vaultABIJson = `[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"proposalId","type":"uint256"},{"indexed":false,"internalType":"address","name":"proposer","type":"address"},{"indexed":false,"internalType":"address[]","name":"targets","type":"address[]"},{"indexed":false,"internalType":"uint256[]","name":"values","type":"uint256[]"},{"indexed":false,"internalType":"string[]","name":"signatures","type":"string[]"},{"indexed":false,"internalType":"bytes[]","name":"calldatas","type":"bytes[]"},{"indexed":false,"internalType":"uint256","name":"voteStart","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"voteEnd","type":"uint256"},{"indexed":false,"internalType":"string","name":"description","type":"string"}],"name":"ProposalCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"voter","type":"address"},{"indexed":false,"internalType":"uint256","name":"proposalId","type":"uint256"},{"indexed":false,"internalType":"uint8","name":"support","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"weight","type":"uint256"},{"indexed":false,"internalType":"string","name":"reason","type":"string"}],"name":"VoteCast","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"proposalId","type":"uint256"}],"name":"ProposalExecuted","type":"event"}]`

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
	vaultAbi, _ := abi.JSON(strings.NewReader(vaultABIJson))

	sigProposalCreated = vaultAbi.Events["ProposalCreated"].ID
	sigVoteCast = vaultAbi.Events["VoteCast"].ID
	sigProposalExecuted = vaultAbi.Events["ProposalExecuted"].ID

	medalAddr := common.HexToAddress(c.Eth.ContractAddress)
	vaultAddr := common.HexToAddress(c.Eth.VaultAddress)

	header, err := client.HeaderByNumber(context.Background(), nil)
	if err != nil {
		log.Fatalf("获取最新区块失败: %v", err)
	}
	currentBlock := header.Number.Uint64()
	batchSize := uint64(10)

	// 先优先建立实时监听，确保通道稳固
	query := ethereum.FilterQuery{
		Addresses: []common.Address{medalAddr, vaultAddr},
		Topics:    [][]common.Hash{{sigTransfer, sigProposalCreated, sigVoteCast, sigProposalExecuted}},
	}

	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatalf("订阅实时监听失败: %v", err)
	}
	log.Printf("实时监听已就绪 | 当前高度: %d", currentBlock)

	// 错开历史同步的发车时间
	go func() {
		time.Sleep(1 * time.Second) // 延迟 1 秒启动 Medal 历史同步
		log.Println("[Medal] 历史补录协程已启动")
		syncHistory(client, conn, medalAddr, uint64(c.Eth.StartBlock), currentBlock, []common.Hash{sigTransfer}, vaultAbi, medalAddr, vaultAddr, batchSize)
		log.Println("[Medal] 历史补录完成")
	}()

	go func() {
		time.Sleep(2 * time.Second) // 延迟 2 秒启动 Governor 历史同步
		log.Println("[Governor] 历史补录协程已启动")
		syncHistory(client, conn, vaultAddr, uint64(c.Eth.VaultStartBlock), currentBlock, []common.Hash{sigProposalCreated, sigVoteCast, sigProposalExecuted}, vaultAbi, medalAddr, vaultAddr, batchSize)
		log.Println("[Governor] 历史补录完成")
	}()

	// 保持主线程运行并处理事件
	for {
		select {
		case err := <-sub.Err():
			log.Fatalf("WebSocket 连接异常中断: %v", err)
		case vLog := <-logs:
			processEvent(conn, vLog, medalAddr, vaultAddr, vaultAbi)
		}
	}
}

// syncHistory 同步历史数据
func syncHistory(client *ethclient.Client, conn clickhouse.Conn, addr common.Address, start, end uint64, topics []common.Hash, vAbi abi.ABI, mAddr, vAddr common.Address, batchSize uint64) {
	if start > end {
		return
	}
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
			log.Printf(" 范围 [%d - %d] 同步失败 (RPC限制), 正在重试...", from, to)
			time.Sleep(2 * time.Second)
			continue
		}
		// 解析并写入数据库
		for _, l := range histLogs {
			processEvent(conn, l, mAddr, vAddr, vAbi)
		}
		// 只有成功获取到数据，才进入下一个区块区间
		from += batchSize
		time.Sleep(1 * time.Second)
	}
}

// processEvent 事件处理
func processEvent(conn clickhouse.Conn, vLog types.Log, medalAddr, vaultAddr common.Address, vaultAbi abi.ABI) {
	ctx := context.Background()
	txHash := vLog.TxHash.Hex()

	// 处理勋章购买事件
	if vLog.Address == medalAddr && vLog.Topics[0] == sigTransfer {
		if len(vLog.Topics) < 4 {
			return
		}
		toAddr := strings.ToLower(common.HexToAddress(vLog.Topics[2].Hex()).Hex())
		tokenId := new(big.Int).SetBytes(vLog.Topics[3].Bytes()).Uint64()
		query := `INSERT INTO course_dao.medal_mint_events (token_id, to_address, transaction_hash, block_number, minted_at) VALUES (?, ?, ?, ?, now())`
		_ = conn.Exec(ctx, query, tokenId, toAddr, txHash, vLog.BlockNumber)
		log.Printf("- [勋章] #%d -> %s", tokenId, toAddr[:8])
	}

	// 处理 OpenZeppelin Governor 治理事件
	if vLog.Address == vaultAddr {
		switch vLog.Topics[0] {
		case sigProposalCreated: // 提案
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
			if err := vaultAbi.UnpackIntoInterface(&event, "ProposalCreated", vLog.Data); err != nil {
				log.Printf("解析提案事件失败: %v", err)
				return
			}

			pid := event.ProposalId.String()
			receiver := ""
			amount := "0"
			if len(event.Targets) > 0 {
				receiver = event.Targets[0].Hex()
			}
			if len(event.Values) > 0 {
				amount = event.Values[0].String()
			}

			query := `INSERT INTO course_dao.proposal_created_events (pid, proposer, description, amount, receiver, tx_hash, block_number) VALUES (?, ?, ?, ?, ?, ?, ?)`
			_ = conn.Exec(ctx, query, pid, event.Proposer.Hex(), event.Description, amount, receiver, txHash, vLog.BlockNumber)
			log.Printf("- [提案发起] ID:%s | 接收人:%s", pid[:6]+"...", receiver[:8])

		case sigVoteCast: // 投票
			var event struct {
				ProposalId *big.Int
				Support    uint8
				Weight     *big.Int
				Reason     string
			}
			if err := vaultAbi.UnpackIntoInterface(&event, "VoteCast", vLog.Data); err != nil {
				return
			}
			pid := event.ProposalId.String()
			// Voter 存在于 Topics[1]
			voter := common.HexToAddress(vLog.Topics[1].Hex()).Hex()

			query := `INSERT INTO course_dao.vote_events (pid, voter, weight, tx_hash, block_number) VALUES (?, ?, ?, ?, ?)`
			_ = conn.Exec(ctx, query, pid, voter, event.Weight.String(), txHash, vLog.BlockNumber)
			log.Printf("- [投票完成] ID:%s | 投票人:%s", pid[:6]+"...", voter[:8])

		case sigProposalExecuted: // 执行拨付
			var event struct {
				ProposalId *big.Int
			}
			if err := vaultAbi.UnpackIntoInterface(&event, "ProposalExecuted", vLog.Data); err != nil {
				return
			}
			pid := event.ProposalId.String()

			query := `INSERT INTO course_dao.proposal_executed_events (pid, receiver, amount, tx_hash, block_number) VALUES (?, ?, ?, ?, ?)`
			err := conn.Exec(ctx, query, pid, "", "0", txHash, vLog.BlockNumber)
			if err != nil {
				log.Printf("- [执行失败] 写入DB错误: %v", err)
			} else {
				log.Printf("- [提案执行拨付成功] ID:%s", pid[:6]+"...")
			}
		}
	}
}
