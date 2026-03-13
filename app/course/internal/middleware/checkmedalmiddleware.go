// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package middleware

import (
	"github.com/wwater/course-dao/app/medal/medalclient"
	"github.com/zeromicro/go-zero/rest/httpx"
	"net/http"
)

type CheckMedalMiddleware struct {
	medalRpc medalclient.Medal
}

// NewCheckMedalMiddleware 接收具体的 RPC 客户端
func NewCheckMedalMiddleware(medalRpc medalclient.Medal) *CheckMedalMiddleware {
	return &CheckMedalMiddleware{
		medalRpc: medalRpc,
	}
}

func (m *CheckMedalMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 从 JWT 中拿到用户地址
		userAddr := r.Context().Value("address").(string)

		// 跨服调用：通过 medal-rpc 查询此用户有没有勋章
		resp, err := m.medalRpc.GetMedalsByAddress(r.Context(), &medalclient.GetMedalsReq{
			Address: userAddr,
		})

		// 如果 RPC 出错，或者返回列表为空，说明没有“入场券”
		if err != nil || resp == nil || len(resp.Medals) == 0 {
			httpx.WriteJson(w, http.StatusForbidden, map[string]string{
				"error": "抱歉，本课程仅限 Course DAO 勋章持有者访问。请先申领勋章！",
			})
			return
		}

		next(w, r)
	}
}
