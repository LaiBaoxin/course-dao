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
	CheckMedalMiddleware rest.Middleware
}

func NewServiceContext(c config.Config) *ServiceContext {
	client, err := ethclient.Dial(c.Eth.Rpc)
	if err != nil {
		panic("无法连接到链节点: " + err.Error())
	}

	// 实例化合约对象
	medalAddr := common.HexToAddress(c.Eth.ContractAddress)
	medalContract, err := medal.NewCourseMedal(medalAddr, client)
	if err != nil {
		panic("合约绑定失败: " + err.Error())
	}

	// 初始化 RPC 客户端
	mRpc := medalclient.NewMedal(zrpc.MustNewClient(c.MedalRpc))

	return &ServiceContext{
		Config:               c,
		MedalRpc:             mRpc,
		MedalContract:        medalContract,
		CheckMedalMiddleware: middleware.NewCheckMedalMiddleware(mRpc).Handle,
	}
}
