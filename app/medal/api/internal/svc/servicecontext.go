// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/wwater/course-dao/app/common/contract/medal"
	"github.com/wwater/course-dao/app/medal/api/internal/config"
	"github.com/wwater/course-dao/app/medal/medalclient"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config        config.Config
	MedalRpc      medalclient.Medal
	MedalContract *medal.CourseMedal
}

func NewServiceContext(c config.Config) *ServiceContext {
	// 初始化以太坊客户端
	client, err := ethclient.Dial(c.Eth.Rpc)
	if err != nil {
		panic("无法连接到 Foundry 节点: " + err.Error())
	}

	// 实例化合约对象
	medalAddr := common.HexToAddress(c.Eth.ContractAddress)
	medalContract, err := medal.NewCourseMedal(medalAddr, client)
	if err != nil {
		panic("合约绑定失败: " + err.Error())
	}

	return &ServiceContext{
		Config:        c,
		MedalRpc:      medalclient.NewMedal(zrpc.MustNewClient(c.MedalRpc)),
		MedalContract: medalContract,
	}
}
