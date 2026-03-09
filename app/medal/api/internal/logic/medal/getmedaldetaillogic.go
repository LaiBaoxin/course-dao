// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package medal

import (
	"context"
	"fmt"
	"github.com/wwater/course-dao/app/medal/medalclient"

	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMedalDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMedalDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMedalDetailLogic {
	return &GetMedalDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetMedalDetail 获取勋章详情
func (l *GetMedalDetailLogic) GetMedalDetail(req *types.MedalDetailReq) (resp *types.MedalDetailRes, err error) {
	rpcResp, err := l.svcCtx.MedalRpc.GetMedalByTokenId(l.ctx, &medalclient.GetMedalByTokenIdReq{
		TokenId: req.TokenId,
	})

	if err != nil {
		// 而不是直接抛出 400 错误让前端挂掉
		l.Errorf("ClickHouse 未命中: %v", err)
		return &types.MedalDetailRes{
			Name:        fmt.Sprintf("Course DAO 勋章 #%d", req.TokenId),
			Description: "该勋章已在链上铸造，Indexer 正在拼命同步中，请稍后刷新查看详情。",
			Image:       "https://profile-avatar.csdnimg.cn/5ba0da009be64b6f809b85e0990b2146_weixin_47024018.jpg!1", // 后期改用 IPFS
			Type:        "Processing",
			CreateTime:  "同步中...",
			TxHash:      "",
		}, nil
	}

	return &types.MedalDetailRes{
		Name:        fmt.Sprintf("Course DAO 贡献勋章 #%d", req.TokenId),
		Description: "此勋章由 Course DAO 智能合约签发，代表您在 Web3 转型计划中的代码贡献。",
		Image:       "https://profile-avatar.csdnimg.cn/5ba0da009be64b6f809b85e0990b2146_weixin_47024018.jpg!1", // 后期改用 IPFS
		Type:        l.getMedalLevel(req.TokenId),
		CreateTime:  rpcResp.MintTime,
		TxHash:      rpcResp.TxHash,
	}, nil
}

func (l *GetMedalDetailLogic) getMedalLevel(id uint64) string {
	if id <= 50 {
		return "Genesis"
	}
	return "Contributor"
}
