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
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/zeromicro/go-zero/core/conf"

	"github.com/wwater/course-dao/app/listener/config"
)

var configFile = flag.String("f", "etc/listener.yaml", "the config file")
var logTransferSig = common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: c.ClickHouse.Addr,
		Auth: clickhouse.Auth{
			Database: c.ClickHouse.Database,
			Username: c.ClickHouse.Username,
			Password: c.ClickHouse.Password,
		},
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		log.Fatalf("ClickHouse 连接失败: %v", err)
	}

	client, err := ethclient.Dial(c.Eth.WSRpc)
	if err != nil {
		log.Fatalf("以太坊节点连接失败: %v", err)
	}

	contractAddr := common.HexToAddress(c.Eth.ContractAddress)
	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(c.Eth.StartBlock)),
		Addresses: []common.Address{contractAddr},
		Topics:    [][]common.Hash{{logTransferSig}},
	}

	// 静默同步历史数据
	historicalLogs, err := client.FilterLogs(context.Background(), query)
	if err != nil {
		log.Fatalf("同步历史数据失败: %v", err)
	}

	count := 0
	for _, l := range historicalLogs {
		if inserted := processLog(conn, l); inserted {
			count++
		}
	}
	if count > 0 {
		log.Printf("成功同步 %d 条历史勋章记录", count)
	}

	// 开启实时监听
	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatalf("开启实时监听失败: %v", err)
	}

	log.Printf("服务启动成功，正在监控合约: %s", c.Eth.ContractAddress)

	for {
		select {
		case err := <-sub.Err():
			log.Printf("连接异常中断: %v", err)
			return
		case vLog := <-logs:
			processLog(conn, vLog)
		}
	}
}

func processLog(conn clickhouse.Conn, vLog types.Log) bool {
	if len(vLog.Topics) < 4 || vLog.Topics[0] != logTransferSig {
		return false
	}

	txHash := vLog.TxHash.Hex()

	// 防止重复插入
	var exists uint64
	checkQuery := "SELECT count() FROM course_dao.medal_mint_events WHERE transaction_hash = ?"
	if err := conn.QueryRow(context.Background(), checkQuery, txHash).Scan(&exists); err != nil {
		log.Printf("查询数据库失败: %v", err)
		return false
	}
	if exists > 0 { // 数据已存在，跳过
		return false
	}

	toAddress := strings.ToLower(common.HexToAddress(vLog.Topics[2].Hex()).Hex())
	tokenId := new(big.Int).SetBytes(vLog.Topics[3].Bytes()).Uint64()

	// 构建插入语句
	insertQuery := `INSERT INTO course_dao.medal_mint_events (token_id, to_address, transaction_hash, block_number, minted_at) 
              VALUES (?, ?, ?, ?, now())`

	err := conn.Exec(context.Background(), insertQuery,
		tokenId,
		toAddress,
		txHash,
		vLog.BlockNumber,
	)

	if err != nil {
		log.Printf("写入失败 [TX: %s]: %v", txHash[:10], err)
		return false
	}

	log.Printf("新勋章入库: #%d -> %s...", tokenId, toAddress[:10])
	return true
}
