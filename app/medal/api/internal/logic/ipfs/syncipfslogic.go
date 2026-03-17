// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package ipfs

import (
	"context"
	"fmt"
	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"
	"github.com/wwater/course-dao/app/medal/medal/medal"

	"github.com/zeromicro/go-zero/core/logx"
)

type SyncIPFSLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSyncIPFSLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SyncIPFSLogic {
	return &SyncIPFSLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SyncIPFSLogic) SyncIPFS(req *types.SyncIPFSReq) (resp *types.SyncIPFSResp, err error) {
	// 自动匹配图片文件名
	var fileName string
	switch req.Level {
	case 0:
		fileName = "bronze.png"
	case 1:
		fileName = "silver.png"
	case 2:
		fileName = "gold.png"
	default:
		return nil, fmt.Errorf("无效的勋章等级: %d", req.Level)
	}

	// 拼接本地路径
	localPath := fmt.Sprintf("app/medal/api/assets/medals/%s", fileName)

	// Pinata 工具上传图片
	l.Logger.Infof("正在上传图片至 IPFS: %s", localPath)
	imageHash, err := l.svcCtx.PinataClient.UploadFile(localPath)
	if err != nil {
		return nil, fmt.Errorf("图片上传 IPFS 失败: %v", err)
	}

	// 组装 NFT 标准元数据 (Metadata)
	metadata := map[string]interface{}{
		"name":        fmt.Sprintf("%s #%d", req.Name, req.Level),
		"description": "这是由 Course DAO 颁发的权威链上荣誉勋章，代表持有者的 DAO 身份与权益。",
		"image":       fmt.Sprintf("ipfs://%s", imageHash), // 获取图片哈希
		"attributes": []map[string]interface{}{
			{
				"trait_type": "Level",
				"value":      req.Level,
			},
		},
	}

	// 将整个元数据 JSON 上传到 Pinata
	l.Logger.Info("正在上传元数据 JSON 至 IPFS...")
	metadataHash, err := l.svcCtx.PinataClient.UploadJSON(metadata)
	if err != nil {
		return nil, fmt.Errorf("元数据上传 IPFS 失败: %v", err)
	}

	// 返回最终供合约使用的 URI
	tokenURI := fmt.Sprintf("ipfs://%s", metadataHash)
	l.Logger.Infof("IPFS 同步完成！TokenURI: %s", tokenURI)

	_, err = l.svcCtx.MedalRpc.UpdateMedalTokenUri(l.ctx, &medal.UpdateMedalTokenUriReq{
		Level:    uint32(req.Level),
		TokenUri: tokenURI,
	})
	if err != nil {
		l.Logger.Errorf("调用 RPC 同步数据库失败: %v", err)
		return nil, err
	}

	return &types.SyncIPFSResp{
		TokenURI: tokenURI,
	}, nil
}
