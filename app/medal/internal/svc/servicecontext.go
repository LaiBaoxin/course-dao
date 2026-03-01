package svc

import (
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/wwater/course-dao/app/common/db"
	"github.com/wwater/course-dao/app/medal/internal/config"
)

type ServiceContext struct {
	Config config.Config
	Conn   driver.Conn // clickhouse conn
}

func NewServiceContext(c config.Config) *ServiceContext {
	dbConn, err := db.InitClickHouse(c.ClickHouse.DataSource)
	if err != nil {
		panic("ClickHouse connect failed: " + err.Error())
	}

	return &ServiceContext{
		Config: c,
		Conn:   dbConn,
	}
}
