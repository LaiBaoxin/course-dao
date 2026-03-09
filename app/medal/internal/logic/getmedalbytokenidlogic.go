package logic

import (
	"context"
	"math/big"

	"github.com/wwater/course-dao/app/medal/internal/svc"
	"github.com/wwater/course-dao/app/medal/medal"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMedalByTokenIdLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetMedalByTokenIdLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMedalByTokenIdLogic {
	return &GetMedalByTokenIdLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// GetMedalByTokenId 根据 tokenId 获取勋章信息
func (l *GetMedalByTokenIdLogic) GetMedalByTokenId(in *medal.GetMedalByTokenIdReq) (*medal.MedalDetail, error) {

	var results []struct {
		TokenId     *big.Int `ch:"token_id"`
		TxHash      string   `ch:"tx_hash"`
		BlockNumber uint64   `ch:"block_number"`
		MintTime    string   `ch:"mint_time"`
	}
	// 构建 sql 语句
	query := `SELECT token_id, transaction_hash as tx_hash, block_number, formatDateTime(minted_at, '%Y-%m-%d %H:%i:%s') as mint_time 
		FROM course_dao.medal_mint_events WHERE token_id = ? LIMIT 1`

	// 执行查询
	err := l.svcCtx.Conn.Select(l.ctx, &results, query, in.TokenId)
	if err != nil {
		l.Errorf("查询 ClickHouse 失败 (TokenId: %d): %v", in.TokenId, err)
		return nil, err
	}

	if len(results) == 0 {
		return nil, nil // Not found
	}

	m := results[0]
	tid := uint64(0)
	if m.TokenId != nil {
		tid = m.TokenId.Uint64()
	}

	return &medal.MedalDetail{
		TokenId:     tid,
		TxHash:      m.TxHash,
		BlockNumber: m.BlockNumber,
		MintTime:    m.MintTime,
	}, nil
}
