// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package middleware

import (
	"encoding/json"
	"github.com/wwater/course-dao/app/medal/medalclient"
	"github.com/zeromicro/go-zero/core/logx"
	"net/http"
)

type CheckMedalMiddleware struct {
	MedalRpc medalclient.Medal // 接收传入的 RPC 客户端
}

func NewCheckMedalMiddleware(rpc medalclient.Medal) *CheckMedalMiddleware {
	return &CheckMedalMiddleware{
		MedalRpc: rpc,
	}
}

func (m *CheckMedalMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 从 Context 中提取 JWT 里的 wallet 地址
		walletVal := r.Context().Value("wallet")
		if walletVal == nil {
			http.Error(w, "Unauthorized: JWT 中缺少 wallet 信息", http.StatusUnauthorized)
			return
		}

		walletAddr := walletVal.(string)

		// 调 RPC 查验该地址名下是否有勋章
		resp, err := m.MedalRpc.GetMedalsByAddress(r.Context(), &medalclient.GetMedalsReq{
			Address: walletAddr,
		})

		// 如果报错、返回为空、或者勋章数组长度为 0
		if err != nil || resp == nil || len(resp.Medals) == 0 {

			// 返回 403 状态码及 JSON 提示
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			err = json.NewEncoder(w).Encode(map[string]interface{}{
				"code": 403,
				"msg":  "专属资源门控生效！请先前往 Course DAO 领取创世勋章解锁本课程。",
			})
			if err != nil {
				logx.Errorf("JSON 编码错误: %v", err)
			}
			return
		}

		// 查验通过，放行请求到 Controller
		logx.Infof("放行通过: 地址 %s 勋章校验成功", walletAddr)
		next(w, r)
	}
}
