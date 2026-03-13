// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package course

import (
	"context"

	"github.com/wwater/course-dao/app/course/internal/svc"
	"github.com/wwater/course-dao/app/course/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPremiumCourseLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetPremiumCourseLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPremiumCourseLogic {
	return &GetPremiumCourseLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetPremiumCourseLogic) GetPremiumCourse(req *types.CourseReq) (resp *types.CourseResp, err error) {
	// todo: add your logic here and delete this line

	return
}
