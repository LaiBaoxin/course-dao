// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package governance

import (
	"context"

	"github.com/wwater/course-dao/app/course/internal/svc"
	"github.com/wwater/course-dao/app/course/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListProposalsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListProposalsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListProposalsLogic {
	return &ListProposalsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// ListProposals 获取治理列表
func (l *ListProposalsLogic) ListProposals(req *types.ListProposalsReq) (resp *types.ListProposalsResp, err error) {
	// 编写聚合查询 SQL
	query := `
		SELECT 
			pid, proposer, description, amount, receiver,
			(SELECT sum(toUInt64(weight)) FROM course_dao.vote_events WHERE pid = p.pid) as votes,
			(SELECT count() FROM course_dao.proposal_executed_events WHERE pid = p.pid) as executed
		FROM course_dao.proposal_created_events AS p
		ORDER BY event_time DESC
	`

	rows, err := l.svcCtx.Conn.Query(l.ctx, query)
	if err != nil {
		logx.Errorf("查询 ClickHouse 失败: %v", err)
		return nil, err
	}
	defer rows.Close()

	var list []types.Proposal
	for rows.Next() {
		var (
			p        types.Proposal
			votes    uint64
			executed uint64
		)

		// 扫描字段
		err := rows.Scan(
			&p.Id,
			&p.Proposer,
			&p.Description,
			&p.Amount,
			&p.Receiver,
			&votes,
			&executed,
		)
		if err != nil {
			logx.Errorf("扫描数据失败: %v", err)
			continue
		}

		// 格式化数据
		p.VotesFor = string(votes) // 或者格式化为字符串
		p.Executed = executed > 0

		list = append(list, p)
	}

	return &types.ListProposalsResp{
		List: list,
	}, nil
}
