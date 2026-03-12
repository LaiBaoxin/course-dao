// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/wwater/course-dao/app/common/db"
	"github.com/wwater/course-dao/app/course/internal/config"
	"github.com/wwater/course-dao/app/course/internal/middleware"
	"github.com/wwater/course-dao/app/medal/medalclient"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config               config.Config
	CheckMedalMiddleware rest.Middleware
	Conn                 clickhouse.Conn
	MedalRpc             medalclient.Medal // 挂载 RPC
}

func NewServiceContext(c config.Config) *ServiceContext {
	dbConn, err := db.InitClickHouse(c.ClickHouse.DataSource)
	if err != nil {
		panic("[Course] Service: ClickHouse connect failed: " + err.Error())
	}

	medalRpc := medalclient.NewMedal(zrpc.MustNewClient(c.MedalRpc))

	return &ServiceContext{
		Config:               c,
		Conn:                 dbConn,
		MedalRpc:             medalRpc,
		CheckMedalMiddleware: middleware.NewCheckMedalMiddleware(medalRpc).Handle,
	}
}
