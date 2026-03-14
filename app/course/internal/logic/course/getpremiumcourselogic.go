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
	return &types.CourseResp{
		Title:    "Course DAO 绝密内参：Web3 全栈架构师成长之路",
		VideoUrl: "https://blog.csdn.net/weixin_47024018?spm=1000.2115.3001.10640", // 这里放你的真实视频流地址
	}, nil
}
