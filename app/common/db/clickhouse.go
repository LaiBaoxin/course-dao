package db

import (
	"context"
	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
)

// InitClickHouse 初始化ClickHouse数据库连接
func InitClickHouse(dsn string) (driver.Conn, error) {
	opts, err := clickhouse.ParseDSN(dsn)
	if err != nil {
		return nil, err
	}

	conn, err := clickhouse.Open(opts)
	if err != nil {
		return nil, err
	}

	// 验证连接，确保账号密码和权限都没问题
	if err := conn.Ping(context.Background()); err != nil {
		return nil, err
	}
	return conn, nil
}
