package config

type Config struct {
	Eth struct {
		WSRpc           string // 以太坊 WS 节点地址
		ContractAddress string // 监听勋章合约地址
		VaultAddress    string // 国库合约地址
		StartBlock      int64  // 勋章合约的区块
		VaultStartBlock int64  // 国库合约的区块
		MedalABIPath    string // medalAbi 地址
		VaultABIPath    string // vaultAbi 地址
	}
	ClickHouse struct {
		Addr     []string
		Database string
		Username string
		Password string
	}
}
