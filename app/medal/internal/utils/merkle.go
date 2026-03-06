package utils

import (
	"bytes"
	"math/big"
	"sort"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/math"
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
func HashLeaf(account common.Address, tokenId uint64) []byte {
	// 初始化缓冲区 52 字节
	buf := make([]byte, 52)
	// 放入 20 字节地址
	copy(buf[0:20], account.Bytes())
	// 放入 32 字节 uint256
	idBig := new(big.Int).SetUint64(tokenId)
	idBytes := math.U256Bytes(idBig)
	copy(buf[20:52], idBytes)

	return crypto.Keccak256(buf)
}

// NewMerkleTree 接收哈希后的叶子列表
func NewMerkleTree(leaves [][]byte) *MerkleTree {
	if len(leaves) == 0 {
		return &MerkleTree{}
	}

	// 复制一份叶子并排序
	sortedLeaves := make([][]byte, len(leaves))
	copy(sortedLeaves, leaves)

	sort.Slice(sortedLeaves, func(i, j int) bool {
		return bytes.Compare(sortedLeaves[i], sortedLeaves[j]) < 0
	})

	var levels [][][]byte
	levels = append(levels, sortedLeaves)

	//  逐层向上构建
	for len(levels[len(levels)-1]) > 1 {
		prevLevel := levels[len(levels)-1]
		var nextLevel [][]byte

		for i := 0; i < len(prevLevel); i += 2 {
			if i+1 < len(prevLevel) {
				// 左右节点排序后合并哈希
				h1, h2 := prevLevel[i], prevLevel[i+1]
				if bytes.Compare(h1, h2) > 0 {
					h1, h2 = h2, h1
				}
				nextLevel = append(nextLevel, crypto.Keccak256(append(h1, h2...)))
			} else {
				// 奇数节点提升
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
