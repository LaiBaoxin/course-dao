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
		val := r.Context().Value("wallet")
		userAddr, ok := val.(string)

		if !ok || userAddr == "" {
			// 如果没拿到地址，返回 401 或 403，而不是崩溃
			httpx.WriteJson(w, http.StatusUnauthorized, map[string]string{
				"error": "未能在授权信息中找到钱包地址",
			})
			return
		}

		if m.medalRpc == nil {
			httpx.WriteJson(w, http.StatusInternalServerError, map[string]string{
				"error": "勋章校验服务暂不可用",
			})
			return
		}

		// 跨服调用
		resp, err := m.medalRpc.GetMedalsByAddress(r.Context(), &medalclient.GetMedalsReq{
			Address: userAddr,
		})

		// 如果 RPC 出错，或者返回列表为空
		if err != nil || resp == nil || len(resp.Medals) == 0 {
			httpx.WriteJson(w, http.StatusForbidden, map[string]string{
				"error": "权限不足：本课程仅限 Course DAO 勋章持有者访问。",
			})
			return
		}

		next(w, r)
	}
}
