package logic

import (
	"context"
	"fmt"
	"math/big"
	"strings"

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

// GetMedalsByAddress 根据地址获取勋章列表（已加入去重逻辑）
func (l *GetMedalsByAddressLogic) GetMedalsByAddress(in *medal.GetMedalsReq) (*medal.GetMedalsResp, error) {
	searchAddr := strings.ToLower(in.Address)

	var results []struct {
		TokenId     *big.Int `ch:"token_id"`
		TxHash      string   `ch:"transaction_hash"`
		BlockNumber uint64   `ch:"block_number"`
	}

	// 使用 argMax 确保每个 token_id 只返回 block_number 最大（最新）的那条数据
	query := `
		SELECT 
			token_id, 
			argMax(transaction_hash, block_number) as transaction_hash, 
			max(block_number) as block_number
		FROM course_dao.medal_mint_events 
		WHERE to_address = ?
		GROUP BY token_id
	`

	// 处理后的 searchAddr 进行查询
	err := l.svcCtx.Conn.Select(l.ctx, &results, query, searchAddr)
	if err != nil {
		logx.Errorf("Query ClickHouse error: %v, address: %s", err, searchAddr)
		return nil, fmt.Errorf("query clickhouse error: %v", err)
	}

	// 转换并返回结果
	var medals []*medal.MedalInfo
	for _, r := range results {
		tid := uint64(0)
		if r.TokenId != nil {
			tid = r.TokenId.Uint64()
		}
		medals = append(medals, &medal.MedalInfo{
			TokenId:     tid,
			TxHash:      r.TxHash,
			BlockNumber: r.BlockNumber,
		})
	}

	logx.Infof("Query success, address: %s, unique count: %d", searchAddr, len(medals))
	return &medal.GetMedalsResp{Medals: medals}, nil
}
