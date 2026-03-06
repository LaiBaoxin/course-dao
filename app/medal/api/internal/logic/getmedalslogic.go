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

	// 查询该用户是否有资格领取新勋章
	proofResp, err := l.svcCtx.MedalRpc.GetMedalProof(l.ctx, &medal.GetMedalProofReq{
		Address: req.Address,
	})

	var proof []string
	var claimId uint64
	if err == nil {
		// 说明在白名单里，拿到了证明
		proof = proofResp.Proof
		claimId = proofResp.TokenId
	} else {
		l.Infof("地址 %s 无可领取勋章或不在白名单", req.Address)
	}

	// 组装已拥有勋章列表
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
		Proof:            proof,   // 如果没有资格，这里是空数组
		ClaimableTokenId: claimId, // 如果没有资格，这里是 0
	}, nil
}
