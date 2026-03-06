package main

import (
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/wwater/course-dao/app/medal/internal/utils"
	"log"
	"math/big"

	"github.com/wwater/course-dao/app/medal/internal/contract"
)

func main() {
	// 连接到 Anvil 本地环境
	rpcURL := "http://127.0.0.1:8545"
	// Anvil 默认第一个私钥 (持有者/老师)
	privateKeyHex := "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
	//  CourseMedal 合约地址
	contractAddr := common.HexToAddress("0x5FbDB2315678afecb367f032d93F642f64180aa3")

	// 准备白名单
	whiteList := []utils.LeafData{
		{Account: common.HexToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"), TokenId: 1},
		{Account: common.HexToAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"), TokenId: 2},
	}

	// 计算 Merkle Root
	var leaves [][]byte
	for _, d := range whiteList {
		leaves = append(leaves, utils.HashLeaf(d.Account, d.TokenId))
	}
	tree := utils.NewMerkleTree(leaves)
	var root32 [32]byte
	copy(root32[:], tree.Root)
	fmt.Printf("准备将 Merkle Root 写入合约: 0x%x\n", tree.Root)

	// 建立连接与身份签名
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		log.Fatal(err)
	}

	privateKey, _ := crypto.HexToECDSA(privateKeyHex)
	// 获取发送者地址以便查询 Nonce
	fromAddress := crypto.PubkeyToAddress(privateKey.PublicKey)

	chainID, _ := client.NetworkID(context.Background())
	auth, _ := bind.NewKeyedTransactorWithChainID(privateKey, chainID)

	// 手动同步 Nonce 和 Gas 建议，防止 Anvil 报错
	nonce, _ := client.PendingNonceAt(context.Background(), fromAddress)
	gasPrice, _ := client.SuggestGasPrice(context.Background())
	auth.Nonce = big.NewInt(int64(nonce))
	auth.GasPrice = gasPrice
	auth.GasLimit = uint64(300000)

	// 实例化合约并发送交易
	instance, err := contract.NewCourseMedal(contractAddr, client)
	if err != nil {
		log.Fatal(err)
	}

	tx, err := instance.SetMerkleRoot(auth, root32)
	if err != nil {
		log.Fatalf("设置 Root 失败: %v", err)
	}

	fmt.Printf("交易已发送! Hash: %s\n", tx.Hash().Hex())

	// 等待交易打包，确认最终状态
	receipt, err := bind.WaitMined(context.Background(), client, tx)
	if err != nil {
		log.Fatal(err)
	}
	if receipt.Status == 0 {
		log.Fatal("交易虽已发送但执行失败 (Reverted)，请检查权限或参数。")
	}

	fmt.Println("Root 已成功写入链上。")
}
