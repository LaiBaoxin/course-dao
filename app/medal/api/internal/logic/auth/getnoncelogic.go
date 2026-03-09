// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetNonceLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewGetNonceLogic 获取登录随机数
func NewGetNonceLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetNonceLogic {
	return &GetNonceLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetNonce 获取登录随机数
func (l *GetNonceLogic) GetNonce(req *types.NonceReq) (resp *types.NonceResp, err error) {
	// 简单生成一个基于时间的随机字符串作为 Nonce
	nonce := fmt.Sprintf("CourseDAO-%d", time.Now().UnixNano())

	return &types.NonceResp{
		Nonce: nonce,
	}, nil
}
