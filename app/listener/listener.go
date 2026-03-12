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

	// Transfer 事件固定哈希
	sigTransfer = common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")

	// 动态哈希
	sigProposalCreated common.Hash
	sigVoted           common.Hash
	sigExecuted        common.Hash
)

const vaultABIJson = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"pid","type":"uint256"},{"name":"desc","type":"string"},{"name":"amount","type":"uint256"},{"name":"receiver","type":"address"}],"name":"ProposalCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"pid","type":"uint256"},{"name":"voter","type":"address"},{"name":"weight","type":"uint256"}],"name":"Voted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"pid","type":"uint256"},{"name":"receiver","type":"address"},{"name":"amount","type":"uint256"}],"name":"Executed","type":"event"}]`

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

	client, err := ethclient.Dial(c.Eth.WSRpc)
	if err != nil {
		log.Fatalf("Eth 失败: %v", err)
	}
	vaultAbi, _ := abi.JSON(strings.NewReader(vaultABIJson))

	sigProposalCreated = vaultAbi.Events["ProposalCreated"].ID
	sigVoted = vaultAbi.Events["Voted"].ID
	sigExecuted = vaultAbi.Events["Executed"].ID

	medalAddr := common.HexToAddress(c.Eth.ContractAddress)
	vaultAddr := common.HexToAddress(c.Eth.VaultAddress)

	// 先获取当前区块高度，作为历史同步的终点和实时监听的逻辑起点
	header, err := client.HeaderByNumber(context.Background(), nil)
	if err != nil {
		log.Fatalf("获取最新区块失败: %v", err)
	}
	currentBlock := header.Number.Uint64()

	batchSize := uint64(10)

	go func() {
		log.Println("[Medal] 历史补录协程已启动")
		syncHistory(client, conn, medalAddr, uint64(c.Eth.StartBlock), currentBlock, []common.Hash{sigTransfer}, vaultAbi, medalAddr, vaultAddr, batchSize)
		log.Println("[Medal] 历史补录完成")
	}()

	go func() {
		log.Println("[Vault] 历史补录协程已启动")
		syncHistory(client, conn, vaultAddr, uint64(c.Eth.VaultStartBlock), currentBlock, []common.Hash{sigProposalCreated, sigVoted, sigExecuted}, vaultAbi, medalAddr, vaultAddr, batchSize)
		log.Println("[Vault] 历史补录完成")
	}()

	// 主线程开启实时监听
	query := ethereum.FilterQuery{
		Addresses: []common.Address{medalAddr, vaultAddr},
		Topics:    [][]common.Hash{{sigTransfer, sigProposalCreated, sigVoted, sigExecuted}},
	}

	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatalf("订阅实时监听失败: %v", err)
	}

	log.Printf("实时监听已就绪 | 当前高度: %d", currentBlock)

	for {
		select {
		case err := <-sub.Err():
			log.Printf("连接中断，尝试重启: %v", err)
			return
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
	for from := start; from <= end; from += batchSize {
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
			log.Printf(" 范围 [%d - %d] 同步失败 (RPC限制), 稍后重试...", from, to)
			time.Sleep(1 * time.Second)
			continue
		}

		for _, l := range histLogs {
			processEvent(conn, l, mAddr, vAddr, vAbi)
		}
		time.Sleep(200 * time.Millisecond)
	}
}

// processEvent 事件处理
func processEvent(conn clickhouse.Conn, vLog types.Log, medalAddr, vaultAddr common.Address, vaultAbi abi.ABI) {
	ctx := context.Background()
	txHash := vLog.TxHash.Hex()

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

	if vLog.Address == vaultAddr {
		pid := vLog.Topics[1].Big().String()
		switch vLog.Topics[0] {
		case sigProposalCreated: // 提案
			var event struct {
				Desc     string
				Amount   *big.Int
				Receiver common.Address
			}
			if err := vaultAbi.UnpackIntoInterface(&event, "ProposalCreated", vLog.Data); err != nil {
				return
			}
			// 这里因为参数去掉了 proposer，我们暂时把 proposer 留空存入数据库
			query := `INSERT INTO course_dao.proposal_created_events (pid, proposer, description, amount, receiver, tx_hash, block_number) VALUES (?, ?, ?, ?, ?, ?, ?)`
			_ = conn.Exec(ctx, query, pid, "", event.Desc, event.Amount.String(), event.Receiver.Hex(), txHash, vLog.BlockNumber)
			log.Printf("- [提案] ID:%s | 金额:%s", pid, event.Amount.String())
		case sigVoted: // 投票
			var event struct {
				Voter  common.Address
				Weight *big.Int
			}
			_ = vaultAbi.UnpackIntoInterface(&event, "Voted", vLog.Data)
			query := `INSERT INTO course_dao.vote_events (pid, voter, weight, tx_hash, block_number) VALUES (?, ?, ?, ?, ?)`
			_ = conn.Exec(ctx, query, pid, event.Voter.Hex(), event.Weight.String(), txHash, vLog.BlockNumber)
			log.Printf("- [投票] ID:%s | 投票人:%s", pid, event.Voter.Hex()[:8])
		case sigExecuted: // 执行
			var event struct {
				Receiver common.Address
				Amount   *big.Int
			}
			// 解析合约数据
			_ = vaultAbi.UnpackIntoInterface(&event, "Executed", vLog.Data)
			query := `INSERT INTO course_dao.proposal_executed_events (pid, receiver, amount, tx_hash, block_number) VALUES (?, ?, ?, ?, ?)`
			err := conn.Exec(ctx, query, pid, event.Receiver.Hex(), event.Amount.String(), txHash, vLog.BlockNumber)
			if err != nil {
				log.Printf("- [执行] 写入 ClickHouse 失败: %v", err)
			} else {
				log.Printf("- [执行] ID:%s | 数据已入库", pid)
			}
		}
	}
}
