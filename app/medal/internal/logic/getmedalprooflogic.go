package logic

import (
	"context"
	"errors"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/wwater/course-dao/app/medal/internal/svc"
	"github.com/wwater/course-dao/app/medal/internal/utils"
	"github.com/wwater/course-dao/app/medal/medal/medal"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMedalProofLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
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
	targetAddrStr := strings.ToLower(strings.TrimSpace(in.Address))
	l.Infof("RPC 收到 Proof 请求: %s", targetAddrStr)

	// 查找白名单
	query := "SELECT address, CAST(token_id AS UInt64), CAST(level AS UInt8) FROM course_dao.medal_white_list FINAL ORDER BY address ASC"
	rows, err := l.svcCtx.Conn.Query(l.ctx, query)
	if err != nil {
		l.Errorf("查询 ClickHouse 白名单失败: %v", err)
		return nil, errors.New("failed to fetch whitelist from database")
	}
	defer rows.Close()

	var leaves [][]byte
	var userTokenId uint64
	var userLevel uint8
	var found bool

	// 动态构建 Merkle Tree
	for rows.Next() {
		var addr string
		var tid uint64
		var level uint8
		if err := rows.Scan(&addr, &tid, &level); err != nil {
			l.Errorf("解析行数据失败: %v", err)
			continue
		}
		l.Infof("【数据库内容诊断】长度: %d, 地址: [%s], TokenID: %d, Level: %d", len(addr), addr, tid, level)

		// 数据库里读出来的地址也转小写
		cleanAddr := strings.ToLower(strings.TrimSpace(addr))

		// 构建叶子节点并加入树中
		leaf := utils.HashLeaf(cleanAddr, tid, level)
		leaves = append(leaves, leaf)

		// 顺便检查当前行是不是正在请求的用户
		if cleanAddr == targetAddrStr {
			userTokenId = tid
			userLevel = level
			found = true
		}
	}

	if err := rows.Err(); err != nil {
		l.Errorf("遍历结果集发生错误: %v", err)
	}

	if !found {
		return nil, errors.New("address not in whitelist")
	}

	tree := utils.NewMerkleTree(leaves)
	userLeaf := utils.HashLeaf(targetAddrStr, userTokenId, userLevel)
	proofBytes := tree.GetProof(userLeaf)

	proofStrings := make([]string, 0)
	if proofBytes != nil {
		for _, p := range proofBytes {
			proofStrings = append(proofStrings, common.BytesToHash(p).Hex())
		}
	}

	l.Infof("动态 Proof 生成成功: ID=%d, Level=%d, Root=0x%x", userTokenId, userLevel, tree.Root)
	return &medal.GetMedalProofResp{
		Proof:   proofStrings,
		TokenId: userTokenId,
	}, nil
}
