package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"

	"github.com/wwater/course-dao/app/common/contract/medal"
	"github.com/wwater/course-dao/app/medal/internal/utils"
)

func main() {
	// 连接 ClickHouse 读取白名单
	conn, _ := clickhouse.Open(&clickhouse.Options{
		Addr: []string{"127.0.0.1:9000"},
		Auth: clickhouse.Auth{
			Database: "course_dao",
			Username: "admin",
			Password: "123456"},
		DialTimeout: 5 * time.Second,
	})

	query := "SELECT address, CAST(token_id AS UInt64), CAST(level AS UInt8) FROM course_dao.medal_white_list FINAL ORDER BY address ASC"

	rows, err := conn.Query(context.Background(), query)
	if err != nil {
		log.Fatalf("读取白名单失败: %v", err)
	}
	defer rows.Close()

	var leaves [][]byte
	for rows.Next() {
		var addr string
		var tid uint64
		var level uint8
		if err := rows.Scan(&addr, &tid, &level); err != nil {
			continue
		}
		// 统一转小写，和 RPC 逻辑完全闭环
		cleanAddr := strings.ToLower(strings.TrimSpace(addr))
		leaf := utils.HashLeaf(cleanAddr, tid, level)
		leaves = append(leaves, leaf)
		fmt.Printf("加入树节点: %s (ID: %d, Level: %d)\n", cleanAddr, tid, level)
	}

	if len(leaves) == 0 {
		log.Fatal("白名单为空，停止更新！")
	}

	tree := utils.NewMerkleTree(leaves)
	rootHash := common.BytesToHash(tree.Root)
	fmt.Printf("计算出的新 Root: %s\n", rootHash.Hex())

	// 连接 Sepolia 写入合约
	client, _ := ethclient.Dial("https://eth-sepolia.g.alchemy.com/v2/h81_NhzDAZa0CosfZKdur")
	privateKey, _ := crypto.HexToECDSA("钱包私钥地址")
	auth, _ := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(11155111))

	contractAddr := common.HexToAddress("0xDB74fc276B744F433507Df2b1547573B9392a986")
	instance, _ := medal.NewCourseMedal(contractAddr, client)

	tx, err := instance.SetMerkleRoot(auth, rootHash)
	if err != nil {
		log.Fatalf("合约更新失败: %v", err)
	}
	fmt.Printf("✅ 合约 Root 已同步! 交易哈希: %s\n", tx.Hash().Hex())
}
