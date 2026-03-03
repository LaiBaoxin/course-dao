// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"github.com/wwater/course-dao/app/medal/api/internal/config"
	"github.com/wwater/course-dao/app/medal/medalclient"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config   config.Config
	MedalRpc medalclient.Medal
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config:   c,
		MedalRpc: medalclient.NewMedal(zrpc.MustNewClient(c.MedalRpc)),
	}
}
