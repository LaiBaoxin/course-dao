package utils

import (
	"bytes"
	"encoding/binary"
	"sort"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// LeafData 用于存放原始白名单信息
type LeafData struct {
	Account common.Address
	TokenId uint64
}

// MerkleTree 默克尔树结构体
type MerkleTree struct {
	Root   []byte
	leaves [][]byte
	levels [][][]byte
}

// HashLeaf 对齐 solidity 的 52字节
func HashLeaf(address string, tokenId uint64) []byte {
	addr := common.HexToAddress(address)

	// uint256 在 EVM 中占 32 字节
	tokenBuf := make([]byte, 32)
	binary.BigEndian.PutUint64(tokenBuf[24:], tokenId) // 后 8 字节填充，前面补 0

	// 拼接: 20字节地址 + 32字节数字 = 52字节
	var data []byte
	data = append(data, addr.Bytes()...)
	data = append(data, tokenBuf...)

	return crypto.Keccak256(data)
}

// NewMerkleTree 接收哈希后的叶子列表
func NewMerkleTree(leaves [][]byte) *MerkleTree {
	if len(leaves) == 0 {
		return &MerkleTree{}
	}

	// 保证 Root 的唯一性
	sortedLeaves := make([][]byte, len(leaves))
	copy(sortedLeaves, leaves)
	sort.Slice(sortedLeaves, func(i, j int) bool {
		return bytes.Compare(sortedLeaves[i], sortedLeaves[j]) < 0
	})

	var levels [][][]byte
	levels = append(levels, sortedLeaves)

	for len(levels[len(levels)-1]) > 1 {
		prevLevel := levels[len(levels)-1]
		var nextLevel [][]byte

		for i := 0; i < len(prevLevel); i += 2 {
			if i+1 < len(prevLevel) {
				h1, h2 := prevLevel[i], prevLevel[i+1]
				// ⚖️ 左右排序合并（OpenZeppelin 标准）
				if bytes.Compare(h1, h2) > 0 {
					h1, h2 = h2, h1
				}
				nextLevel = append(nextLevel, crypto.Keccak256(append(h1, h2...)))
			} else {
				nextLevel = append(nextLevel, prevLevel[i])
			}
		}
		levels = append(levels, nextLevel)
	}

	return &MerkleTree{
		Root:   levels[len(levels)-1][0],
		leaves: sortedLeaves,
		levels: levels,
	}
}

// GetProof 生成指定叶子的证明
func (m *MerkleTree) GetProof(leaf []byte) [][]byte {
	var proof [][]byte
	idx := -1
	for i, l := range m.leaves {
		if bytes.Equal(l, leaf) {
			idx = i
			break
		}
	}

	if idx == -1 {
		return nil
	}

	for _, level := range m.levels {
		if len(level) <= 1 {
			break
		}
		siblingIdx := idx ^ 1
		if siblingIdx < len(level) {
			proof = append(proof, level[siblingIdx])
		}
		idx /= 2
	}
	return proof
}
