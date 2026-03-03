package logic

import (
	"context"
	"fmt"

	"github.com/wwater/course-dao/app/medal/internal/svc"
	"github.com/wwater/course-dao/app/medal/medal"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMedalsByAddressLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetMedalsByAddressLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMedalsByAddressLogic {
	return &GetMedalsByAddressLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// GetMedalsByAddress 根据地址获取勋章列表
func (l *GetMedalsByAddressLogic) GetMedalsByAddress(in *medal.GetMedalsReq) (*medal.GetMedalsResp, error) {
	var results []struct {
		TokenId     uint64 `ch:"token_id"`
		TxHash      string `ch:"transaction_hash"`
		BlockNumber uint64 `ch:"block_number"`
	}

	query := `SELECT token_id, transaction_hash, block_number 
	          FROM medal_mint_events 
	          WHERE to_address = ? 
	          ORDER BY minted_at DESC`

	// 查询
	err := l.svcCtx.Conn.Select(l.ctx, &results, query, in.Address)
	if err != nil {
		return nil, fmt.Errorf("query clickhouse error: %v", err)
	}

	// 转换并返回结果
	var medals []*medal.MedalInfo
	for _, r := range results {
		medals = append(medals, &medal.MedalInfo{
			TokenId:     r.TokenId,
			TxHash:      r.TxHash,
			BlockNumber: r.BlockNumber,
		})
	}

	return &medal.GetMedalsResp{Medals: medals}, nil
}
