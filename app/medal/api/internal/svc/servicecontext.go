// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/wwater/course-dao/app/common/contract/medal"
	"github.com/wwater/course-dao/app/medal/api/internal/config"
	"github.com/wwater/course-dao/app/medal/api/internal/middleware"
	"github.com/wwater/course-dao/app/medal/medalclient"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config               config.Config
	MedalRpc             medalclient.Medal
	MedalContract        *medal.CourseMedal
	CheckMedalMiddleware rest.Middleware // 注册自定义中间件
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

	medalRpc := medalclient.NewMedal(zrpc.MustNewClient(c.MedalRpc))

	return &ServiceContext{
		Config:               c,
		MedalRpc:             medalRpc,
		MedalContract:        medalContract,
		CheckMedalMiddleware: middleware.NewCheckMedalMiddleware(medalRpc).Handle,
	}
}
