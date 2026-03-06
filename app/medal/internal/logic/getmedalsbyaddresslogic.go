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

// GetMedalsByAddress 根据地址获取勋章列表
func (l *GetMedalsByAddressLogic) GetMedalsByAddress(in *medal.GetMedalsReq) (*medal.GetMedalsResp, error) {
	// 归一化地址
	searchAddr := strings.ToLower(in.Address)

	var results []struct {
		TokenId     *big.Int `ch:"token_id"`
		TxHash      string   `ch:"transaction_hash"`
		BlockNumber uint64   `ch:"block_number"`
	}

	query := `SELECT token_id, transaction_hash, block_number 
              FROM course_dao.medal_mint_events 
              WHERE to_address = ?`

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

	logx.Infof("Query success, address: %s, count: %d", searchAddr, len(medals))
	return &medal.GetMedalsResp{Medals: medals}, nil
}
