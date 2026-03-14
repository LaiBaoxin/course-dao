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
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.Size
	if pageSize <= 0 {
		// 默认 6 条数据
		pageSize = 6
	}
	offset := (page - 1) * pageSize

	var total uint64
	countQuery := `SELECT count(*) FROM course_dao.proposal_created_events`
	err = l.svcCtx.Conn.QueryRow(l.ctx, countQuery).Scan(&total)
	if err != nil {
		logx.Errorf("查询 ClickHouse 提案总数失败: %v", err)
		return nil, err
	}

	query := `
	   SELECT 
		  p.pid, 
		  any(p.proposer), 
		  any(p.description), 
		  any(p.amount), 
		  any(p.receiver),
		  toString((SELECT ifNull(sum(toUInt64(weight)), 0) FROM course_dao.vote_events WHERE toString(pid) = toString(p.pid))) as votes,
		  (SELECT count() FROM course_dao.proposal_executed_events WHERE toString(pid) = toString(p.pid)) as executed
	   FROM course_dao.proposal_created_events AS p
	   GROUP BY p.pid
	   ORDER BY any(p.block_number) DESC 
	   LIMIT ? OFFSET ?
	`

	rows, err := l.svcCtx.Conn.Query(l.ctx, query, pageSize, offset)
	if err != nil {
		logx.Errorf("查询 ClickHouse 提案列表失败: %v", err)
		return nil, err
	}
	defer rows.Close()

	var list []types.Proposal
	for rows.Next() {
		var (
			p        types.Proposal
			votesStr string
			executed uint64
		)

		err := rows.Scan(
			&p.Id,
			&p.Proposer,
			&p.Description,
			&p.Amount,
			&p.Receiver,
			&votesStr,
			&executed,
		)
		if err != nil {
			logx.Errorf("扫描数据失败: %v", err)
			continue
		}

		p.VotesFor = votesStr
		p.Executed = executed > 0

		list = append(list, p)
	}

	return &types.ListProposalsResp{
		List:  list,
		Total: int64(total),
	}, nil
}
