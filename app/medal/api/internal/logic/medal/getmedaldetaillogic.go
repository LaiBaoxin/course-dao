// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package medal

import (
	"context"
	"fmt"
	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"
	"github.com/wwater/course-dao/app/medal/medalclient"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMedalDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMedalDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMedalDetailLogic {
	return &GetMedalDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetMedalDetail 获取勋章详情
// GetMedalDetail 获取勋章详情
func (l *GetMedalDetailLogic) GetMedalDetail(req *types.MedalDetailReq) (resp *types.MedalDetailRes, err error) {
	rpcResp, err := l.svcCtx.MedalRpc.GetMedalByTokenId(l.ctx, &medalclient.GetMedalByTokenIdReq{
		TokenId: req.TokenId,
	})

	if err != nil {
		l.Errorf("RPC 详情查询失败: %v", err)
		return nil, err
	}

	// 勋章的对应关系
	level := rpcResp.Level
	var name, description, image string

	switch level {
	case 2: // 黄金勋章
		name = "Course DAO 黄金荣誉勋章"
		description = "这是由 Course DAO 颁发的权威链上荣誉勋章，代表持有者的 DAO 核心身份与最高投票权益。"
		image = "ipfs://bafkreidhe5o7i3tquqqtolcfkf4bodlci4umwm6zgtvolxy3eezstalzva"
	case 1: // 白银勋章
		name = "Course DAO 白银荣誉勋章"
		description = "这是由 Course DAO 颁发的权威链上荣誉勋章，代表持有者的 DAO 进阶身份与投票权益。"
		image = "ipfs://bafkreigcuen6pmoi7xyyvutofzmaw4jjn42vyg4wh2rdzofoek6u7afvba"
	default: // 青铜勋章
		name = "Course DAO 青铜荣誉勋章"
		description = "这是由 Course DAO 颁发的权威链上荣誉勋章，代表持有者的 DAO 基础身份与投票权益。"
		image = "ipfs://bafkreigzbf3jjsvxlx3cuka5oc7wmc2p76jqgbpzanxen53phecvucjhlq"
	}

	return &types.MedalDetailRes{
		// 加上 TokenId 标识
		Name:        fmt.Sprintf("%s #%d", name, rpcResp.TokenId),
		Description: description,
		Image:       image,
		Type:        "Medal",
		CreateTime:  rpcResp.MintTime,
		TxHash:      rpcResp.TxHash,
		Level:       rpcResp.Level,
	}, nil
}
