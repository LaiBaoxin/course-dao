package logic

import (
	"context"
	"github.com/wwater/course-dao/app/medal/internal/svc"
	"github.com/wwater/course-dao/app/medal/medal/medal"
	"github.com/zeromicro/go-zero/core/logx"
	"strings"
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
	query := `
        SELECT token_id, transaction_hash, block_number, level 
        FROM course_dao.medal_mint_events 
        WHERE lower(to_address) = lower(?)
    `

	// 将输入地址也转为小写
	searchAddr := strings.ToLower(in.Address)

	rows, err := l.svcCtx.Conn.Query(l.ctx, query, searchAddr)
	if err != nil {
		l.Errorf("查询 ClickHouse 失败: %v", err)
		return nil, err
	}
	defer rows.Close()

	var medals []*medal.MedalInfo
	count := 0 // 记录实际查到了几行数据
	for rows.Next() {
		count++
		var m medal.MedalInfo
		if err := rows.Scan(&m.TokenId, &m.TxHash, &m.BlockNumber, &m.Level); err != nil {
			l.Errorf("Scan 失败: %v", err)
			return nil, err
		}
		medals = append(medals, &m)
	}

	l.Infof("查询地址: %s, 命中行数: %d", searchAddr, count)

	return &medal.GetMedalsResp{
		Medals: medals,
	}, nil
}
