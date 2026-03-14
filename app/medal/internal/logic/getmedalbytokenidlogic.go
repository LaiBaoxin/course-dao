package logic

import (
	"context"
	"github.com/wwater/course-dao/app/medal/medal/medal"
	"time"

	"github.com/wwater/course-dao/app/medal/internal/svc"
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

	var (
		tokenId     uint64
		level       uint32
		txHash      string
		blockNumber uint64
		mintedAt    time.Time
	)
	// 构建 sql 语句
	query := `SELECT token_id, level, transaction_hash, block_number, minted_at 
              FROM course_dao.medal_mint_events 
              WHERE token_id = ? LIMIT 1`

	// 执行查询
	err := l.svcCtx.Conn.QueryRow(l.ctx, query, in.TokenId).Scan(
		&tokenId,
		&level,
		&txHash,
		&blockNumber,
		&mintedAt,
	)
	if err != nil {
		l.Errorf("查询 ClickHouse 失败 (TokenId: %d): %v", in.TokenId, err)
		return nil, err
	}

	return &medal.MedalDetail{
		TokenId:     tokenId,
		TxHash:      txHash,
		BlockNumber: blockNumber,
		MintTime:    mintedAt.Format("2006-01-02 15:04:05"),
		Level:       level,
	}, nil
}
