package main

import (
	"context"
	"flag"
	"fmt"
	"log"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/wwater/course-dao/app/common/contract/medal"
	"github.com/wwater/course-dao/app/common/db"
	"github.com/zeromicro/go-zero/core/conf"
)

var configFile = flag.String("f", "etc/listener.yaml", "the config file")

func main() {
	flag.Parse()

	var c Config
	conf.MustLoad(*configFile, &c)

	client, err := ethclient.Dial(c.EthEndpoint)
	if err != nil {
		log.Fatal("Eth Client Error:", err)
	}

	chConn, err := db.InitClickHouse(c.ClickHouse.DataSource)
	if err != nil {
		log.Fatal("ClickHouse Error:", err)
	}

	contractAddr := common.HexToAddress(c.MedalAddress)
	medalInstance, err := medal.NewCourseMedal(contractAddr, client)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Listener started on %s watching contract %s\n", c.EthEndpoint, c.MedalAddress)

	// abigen 生成的结构体
	sink := make(chan *medal.CourseMedalTransfer)

	// 调用 WatchTransfer
	sub, err := medalInstance.WatchTransfer(nil, sink, nil, nil, nil)
	if err != nil {
		log.Fatal(err)
	}

	for {
		select {
		case err := <-sub.Err():
			log.Printf("Subscription error: %v", err)
		case event := <-sink:
			// 只有非 0 地址才可以进行铸币
			if event.From == common.HexToAddress("0x0000000000000000000000000000000000000000") {
				// 插入数据
				err = chConn.Exec(
					context.Background(),
					"INSERT INTO medal_mint_events (block_number, transaction_hash, to_address, token_id) VALUES (?, ?, ?, ?)",
					event.Raw.BlockNumber,
					event.Raw.TxHash.Hex(),
					event.To.Hex(),
					event.TokenId.Uint64(),
				)

				if err != nil {
					log.Println("Insert Failed:", err)
				} else {
					fmt.Printf("Synced Token #%d to ClickHouse\n", event.TokenId)
				}
			}
		}
	}
}
