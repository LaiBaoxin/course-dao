// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package course

import (
	"context"

	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPremiumCourseLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewGetPremiumCourseLogic 获取高级课程视频 (仅限 Course DAO 勋章持有者)
func NewGetPremiumCourseLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPremiumCourseLogic {
	return &GetPremiumCourseLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetPremiumCourse 获取高级课程视频 (仅限 Course DAO 勋章持有者)
func (l *GetPremiumCourseLogic) GetPremiumCourse(req *types.CourseReq) (resp *types.CourseResp, err error) {
	return &types.CourseResp{
		Title:    "Web3 后端架构师进阶实战 (DAO 内部绝密版)",
		VideoUrl: "https://blog.csdn.net/weixin_47024018?spm=1000.2115.3001.5343",
	}, nil
}
