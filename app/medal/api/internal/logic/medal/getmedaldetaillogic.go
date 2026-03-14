// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package medal

import (
	"context"
	"fmt"
	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"
	"github.com/wwater/course-dao/app/medal/medalclient"

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
		l.Errorf("RPC 详情查询失败: %v", err)
		return nil, err // 或者返回兜底数据
	}

	return &types.MedalDetailRes{
		Name:        fmt.Sprintf("Course DAO 贡献勋章 #%d", rpcResp.TokenId),
		Description: "此勋章代表您的 DAO 治理身份",
		Image:       "https://...",
		Type:        "Medal",
		CreateTime:  rpcResp.MintTime,
		TxHash:      rpcResp.TxHash,
		Level:       rpcResp.Level,
	}, nil
}
func (l *GetMedalDetailLogic) getMedalLevelName(level uint32) string {
	switch level {
	case 2:
		return "Gold Member"
	case 1:
		return "Silver Member"
	default:
		return "Bronze Member"
	}
}
