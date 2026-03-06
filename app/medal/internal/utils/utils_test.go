package utils

import (
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"testing"
)

func TestMerkle(t *testing.T) {
	addr := common.HexToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
	leaf := HashLeaf(addr, 1)

	tree := NewMerkleTree([][]byte{leaf})
	fmt.Printf("Root: 0x%x\n", tree.Root)

	proof := tree.GetProof(leaf)
	fmt.Printf("Proof length: %d\n", len(proof))
}
