package logic

import (
	"context"
	"errors"

	"github.com/ethereum/go-ethereum/common"
	"github.com/wwater/course-dao/app/medal/internal/svc"
	"github.com/wwater/course-dao/app/medal/internal/utils"
	"github.com/wwater/course-dao/app/medal/medal"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMedalProofLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

// 💡 这里的白名单数据必须与 set_root.go 脚本中的数据严格一致
// 生产环境下建议从数据库或配置文件加载
var whiteList = []utils.LeafData{
	{Account: common.HexToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"), TokenId: 1},
	{Account: common.HexToAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"), TokenId: 2},
}

func NewGetMedalProofLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMedalProofLogic {
	return &GetMedalProofLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// GetMedalProof 根据地址获取勋章证明
func (l *GetMedalProofLogic) GetMedalProof(in *medal.GetMedalProofReq) (*medal.GetMedalProofResp, error) {
	// 将输入的字符串地址转换为以太坊地址类型
	targetAddr := common.HexToAddress(in.Address)
	l.Infof("开始为地址生成 Merkle Proof: %s", targetAddr.Hex())

	var leaves [][]byte
	var userTokenId uint64
	var found bool

	// 构建白名单所有叶子节点，并匹配当前用户
	for _, d := range whiteList {
		// 直接比对 Address 类型
		if d.Account == targetAddr {
			userTokenId = d.TokenId
			found = true
		}
		// 构建 Tree 时使用的哈希必须一致
		leaf := utils.HashLeaf(d.Account.Hex(), d.TokenId)
		leaves = append(leaves, leaf)
	}

	if !found {
		return nil, errors.New("address not in whitelist")
	}

	tree := utils.NewMerkleTree(leaves)
	userLeaf := utils.HashLeaf(targetAddr.Hex(), userTokenId)

	proofBytes := tree.GetProof(userLeaf)
	if proofBytes == nil {
		return nil, errors.New("failed to generate proof")
	}

	var proofStrings []string
	for _, p := range proofBytes {
		proofStrings = append(proofStrings, common.BytesToHash(p).Hex())
	}

	l.Infof("Proof 生成成功: ID=%d, Root=0x%x", userTokenId, tree.Root)
	return &medal.GetMedalProofResp{
		Proof:   proofStrings,
		TokenId: userTokenId,
	}, nil
}
