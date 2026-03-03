// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package logic

import (
	"context"
	"github.com/wwater/course-dao/app/medal/medal"

	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMedalsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMedalsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMedalsLogic {
	return &GetMedalsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetMedals 获取用户所有勋章
func (l *GetMedalsLogic) GetMedals(req *types.GetMedalsReq) (resp *types.GetMedalsResp, err error) {
	// 调用 rpc 处理方法
	rpcResp, err := l.svcCtx.MedalRpc.GetMedalsByAddress(l.ctx, &medal.GetMedalsReq{
		Address: req.Address,
	})
	if err != nil {
		return nil, err
	}

	// 类型转换
	var list []types.MedalInfo
	for _, m := range rpcResp.Medals {
		list = append(list, types.MedalInfo{
			TokenId:     m.TokenId,
			TxHash:      m.TxHash,
			BlockNumber: m.BlockNumber,
		})
	}

	return &types.GetMedalsResp{Medals: list}, nil
}
