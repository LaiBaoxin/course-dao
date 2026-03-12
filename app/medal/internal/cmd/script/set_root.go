package main

import (
	"fmt"
	"log"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/wwater/course-dao/app/common/contract/medal"
	"github.com/wwater/course-dao/app/medal/internal/utils"
)

func main() {
	// 准备数据
	myAddress := "0x86CA3206A0B51914b9459AADa3B70B6ee3f2d983"
	fakeAddress := "0x0000000000000000000000000000000000000001"

	// 计算 Root
	leaf1 := utils.HashLeaf(myAddress, 1)
	leaf2 := utils.HashLeaf(fakeAddress, 2)
	tree := utils.NewMerkleTree([][]byte{leaf1, leaf2})

	// 连接 Sepolia 链上
	client, _ := ethclient.Dial("https://eth-sepolia.g.alchemy.com/v2/h81_NhzDAZa0CosfZKdur")
	privateKey, _ := crypto.HexToECDSA("钱包私钥地址")
	auth, _ := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(11155111))

	contractAddr := common.HexToAddress("0xdD782fB0cf54970F1706c4E8fE5EA1f64d13A524")
	instance, _ := medal.NewCourseMedal(contractAddr, client)

	// 写入
	rootHash := common.BytesToHash(tree.Root)
	tx, err := instance.SetMerkleRoot(auth, rootHash)
	if err != nil {
		log.Fatalf("写入失败: %v", err)
	}
	fmt.Printf("Root 已写入! Hash: %s\n", tx.Hash().Hex())
}
