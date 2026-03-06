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
	userAddr := common.HexToAddress(in.Address)
	l.Infof("开始为地址生成 Merkle Proof: %s", userAddr.Hex())

	var leaves [][]byte
	var userTokenId uint64
	var found bool

	// 遍历白名单：构建所有叶子节点，并匹配当前用户
	for _, d := range whiteList {
		// 使用我们工具类中的 HashLeaf (52字节对齐逻辑)
		leaf := utils.HashLeaf(d.Account, d.TokenId)
		leaves = append(leaves, leaf)

		if d.Account == userAddr {
			userTokenId = d.TokenId
			found = true
		}
	}

	// 如果地址不在白名单中，拒绝请求
	if !found {
		l.Errorf("查询失败：地址 %s 不在白名单内", userAddr.Hex())
		return nil, errors.New("address not in whitelist")
	}

	// 构建 Merkle Tree
	tree := utils.NewMerkleTree(leaves)

	// 生成当前用户的 Proof 路径
	userLeaf := utils.HashLeaf(userAddr, userTokenId)
	proofBytes := tree.GetProof(userLeaf)

	// 将 [][]byte 格式的证明转换为前端易读的 Hex 字符串数组
	var proofStrings []string
	for _, p := range proofBytes {
		proofStrings = append(proofStrings, common.BytesToHash(p).Hex())
	}

	l.Infof("证明生成成功！TokenID: %d, Proof 深度: %d", userTokenId, len(proofStrings))

	return &medal.GetMedalProofResp{
		Proof:   proofStrings,
		TokenId: userTokenId,
	}, nil
}
