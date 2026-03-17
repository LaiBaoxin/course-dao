package logic

import (
	"context"

	"github.com/wwater/course-dao/app/medal/internal/svc"
	"github.com/wwater/course-dao/app/medal/medal/medal"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateMedalTokenUriLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdateMedalTokenUriLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateMedalTokenUriLogic {
	return &UpdateMedalTokenUriLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// UpdateMedalTokenUri 同步 IPFS 链接到数据库
func (l *UpdateMedalTokenUriLogic) UpdateMedalTokenUri(in *medal.UpdateMedalTokenUriReq) (*medal.UpdateMedalTokenUriResp, error) {
	query := "ALTER TABLE medal_white_list UPDATE token_uri = ? WHERE level = ?"

	// 假设你在 svcCtx 中已经初始化了 ClickHouse 客户端
	err := l.svcCtx.Conn.Exec(l.ctx, query, in.TokenUri, in.Level)
	if err != nil {
		l.Logger.Errorf("ClickHouse 更新 token_uri 失败: %v", err)
		return nil, err
	}

	return &medal.UpdateMedalTokenUriResp{Success: true}, nil
}
