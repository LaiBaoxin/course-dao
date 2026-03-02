package main

import (
	"github.com/zeromicro/go-zero/core/logx"
)

type Config struct {
	// 以太坊节点地址 (本地 Anvil节点)
	EthEndpoint string
	// CourseMedal 合约地址
	MedalAddress string
	// ClickHouse 配置
	ClickHouse struct {
		DataSource string
	}
	// 日志
	Log logx.LogConf
}
