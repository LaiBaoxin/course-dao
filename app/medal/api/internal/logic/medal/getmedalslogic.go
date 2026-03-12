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

// GetMedals 获取用户所有的勋章以及可领取的证明
func (l *GetMedalsLogic) GetMedals(req *types.GetMedalsReq) (resp *types.GetMedalsResp, err error) {
	// 获取已拥有的勋章列表
	ownedRpcResp, err := l.svcCtx.MedalRpc.GetMedalsByAddress(l.ctx, &medal.GetMedalsReq{
		Address: req.Address,
	})

	ownedMedals := make([]types.MedalInfo, 0)
	if err == nil && ownedRpcResp != nil {
		for _, m := range ownedRpcResp.Medals {
			ownedMedals = append(ownedMedals, types.MedalInfo{
				TokenId:     m.TokenId,
				TxHash:      m.TxHash,
				BlockNumber: m.BlockNumber,
			})
		}
	} else {
		l.Errorf("获取已拥有勋章失败: %v", err)
	}

	// 获取领取证明 (Merkle Proof)
	proof := make([]string, 0)
	var claimableTokenId uint64

	proofRpcResp, err := l.svcCtx.MedalRpc.GetMedalProof(l.ctx, &medal.GetMedalProofReq{
		Address: req.Address,
	})

	if err == nil && proofRpcResp != nil {
		// 只有在匹配到白名单时，RPC 才会返回非空的 proof
		proof = proofRpcResp.Proof
		claimableTokenId = proofRpcResp.TokenId
		l.Infof("地址 %s 匹配白名单: TokenID=%d, Proof长度=%d", req.Address, claimableTokenId, len(proof))
	} else {
		// RPC 错误或地址不在白名单
		l.Infof("地址 %s 未在白名单或暂时无法获取证明", req.Address)
	}

	return &types.GetMedalsResp{
		Medals:           ownedMedals,
		Proof:            proof,
		ClaimableTokenId: claimableTokenId,
	}, nil
}
