package config

type Config struct {
	Eth struct {
		WSRpc           string // 以太坊 WS 节点地址
		ContractAddress string // 监听的合约地址
		StartBlock      int64
	}
	ClickHouse struct {
		Addr     []string
		Database string
		Username string
		Password string
	}
}
