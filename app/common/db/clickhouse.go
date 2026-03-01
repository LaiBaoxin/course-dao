package db

import (
	"context"
	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"time"
)

type DB struct {
	Conn driver.Conn
}

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

// Exec 通用的执行逻辑
func (db *DB) Exec(query string, args ...any) error {
	// 设置上下文超市时间 5 秒
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return db.Conn.Exec(ctx, query, args...)
}

// Query 通用的查询逻辑
func (db *DB) Query(dest any, query string, args ...any) error {
	// 设置上下文超市时间 5 秒
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return db.Conn.Select(ctx, dest, query, args...)
}
