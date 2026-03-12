// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/wwater/course-dao/app/common/db"
	"github.com/wwater/course-dao/app/course/internal/config"
	"github.com/wwater/course-dao/app/course/internal/middleware"
	"github.com/zeromicro/go-zero/rest"
)

type ServiceContext struct {
	Config               config.Config
	CheckMedalMiddleware rest.Middleware
	Conn                 clickhouse.Conn
}

func NewServiceContext(c config.Config) *ServiceContext {
	dbConn, err := db.InitClickHouse(c.ClickHouse.DataSource)
	if err != nil {
		panic("[Course] Service: ClickHouse connect failed: " + err.Error())
	}

	return &ServiceContext{
		Config:               c,
		Conn:                 dbConn,
		CheckMedalMiddleware: middleware.NewCheckMedalMiddleware().Handle,
	}
}
