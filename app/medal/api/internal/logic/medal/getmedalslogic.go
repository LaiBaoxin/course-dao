// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package medal

import (
	"context"
	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"
	"github.com/wwater/course-dao/app/medal/medal"

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
	// 1. 获取已拥有列表
	rpcResp, _ := l.svcCtx.MedalRpc.GetMedalsByAddress(l.ctx, &medal.GetMedalsReq{
		Address: req.Address,
	})

	// 2. 获取 Proof（始终尝试获取，不因为本地数据库状态拦截）
	proofResp, err := l.svcCtx.MedalRpc.GetMedalProof(l.ctx, &medal.GetMedalProofReq{
		Address: req.Address,
	})

	var proof []string
	var claimId uint64
	if err == nil && proofResp != nil {
		// 即使 BalanceOf > 0 也建议下发 Proof，由前端决定是否显示“已领取”按钮
		// 这样可以避免 Anvil 重启后 API 拦截导致的无法测试
		proof = proofResp.Proof
		claimId = proofResp.TokenId
	}

	var list []types.MedalInfo
	if rpcResp != nil {
		for _, m := range rpcResp.Medals {
			list = append(list, types.MedalInfo{
				TokenId:     m.TokenId,
				TxHash:      m.TxHash,
				BlockNumber: m.BlockNumber,
			})
		}
	}

	return &types.GetMedalsResp{
		Medals:           list,
		Proof:            proof,
		ClaimableTokenId: claimId,
	}, nil
}
