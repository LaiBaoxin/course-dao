package logic

import (
	"context"
	"errors"
	"strings"

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

// 设置白名单
var whiteList = []utils.LeafData{
	{Account: common.HexToAddress("0x86CA3206A0B51914b9459AADa3B70B6ee3f2d983"), TokenId: 1},
	{Account: common.HexToAddress("0x0000000000000000000000000000000000000001"), TokenId: 2},
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
	targetAddrStr := strings.ToLower(strings.TrimSpace(in.Address))
	l.Infof("RPC 收到 Proof 请求: %s", targetAddrStr)

	var leaves [][]byte
	var userTokenId uint64
	var found bool

	// 构建白名单所有叶子节点，并匹配当前用户
	for _, d := range whiteList {
		// 构建叶子
		leaf := utils.HashLeaf(d.Account.Hex(), d.TokenId)
		leaves = append(leaves, leaf)

		// 匹配当前请求者
		if strings.ToLower(d.Account.Hex()) == targetAddrStr {
			userTokenId = d.TokenId
			found = true
		}
	}

	if !found {
		return nil, errors.New("address not in whitelist")
	}

	tree := utils.NewMerkleTree(leaves)
	userLeaf := utils.HashLeaf(common.HexToAddress(targetAddrStr).Hex(), userTokenId)
	proofBytes := tree.GetProof(userLeaf)

	proofStrings := make([]string, 0)
	if proofBytes != nil {
		for _, p := range proofBytes {
			proofStrings = append(proofStrings, common.BytesToHash(p).Hex())
		}
	}

	l.Infof("Proof 生成成功: ID=%d, Root=0x%x", userTokenId, tree.Root)
	return &medal.GetMedalProofResp{
		Proof:   proofStrings,
		TokenId: userTokenId,
	}, nil
}
