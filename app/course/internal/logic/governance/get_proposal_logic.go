package governance

import (
	"context"
	"fmt"
	"strconv"

	"github.com/wwater/course-dao/app/course/internal/svc"
	"github.com/wwater/course-dao/app/course/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetProposalLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetProposalLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetProposalLogic {
	return &GetProposalLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetProposal 获取提案详情
func (l *GetProposalLogic) GetProposal(req *types.ProposalDetailReq) (resp *types.Proposal, err error) {
	// 获取提案详情
	query := `
		SELECT 
			pid, proposer, description, amount, receiver,
			(SELECT ifNull(sum(toUInt64(weight)), 0) FROM course_dao.vote_events WHERE pid = p.pid) as votes,
			(SELECT count() FROM course_dao.proposal_executed_events WHERE pid = p.pid) as executed
		FROM course_dao.proposal_created_events AS p
		WHERE pid = ? 
		LIMIT 1
	`

	var (
		p        types.Proposal
		votes    uint64
		executed uint64
	)

	// 获取单行数据
	err = l.svcCtx.Conn.QueryRow(l.ctx, query, req.Id).Scan(
		&p.Id,
		&p.Proposer,
		&p.Description,
		&p.Amount,
		&p.Receiver,
		&votes,
		&executed,
	)

	// 如果是没查到数据
	if err != nil {
		l.Errorf("查询提案详情失败, pid: %s, error: %v", req.Id, err)
		return nil, fmt.Errorf("未找到 ID 为 %s 的提案", req.Id)
	}

	// 将 uint64 的票数转为字符串返回给前端
	p.VotesFor = strconv.FormatUint(votes, 10)
	// 判断 count 是否大于 0 确定执行状态
	p.Executed = executed > 0

	l.Infof("成功获取提案详情, pid: %s", req.Id)

	return &p, nil
}
