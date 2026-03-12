package middleware

import (
	"encoding/json"
	"github.com/wwater/course-dao/app/medal/medalclient"
	"github.com/zeromicro/go-zero/core/logx"
	"net/http"
	"strings"
)

type CheckMedalMiddleware struct {
	MedalRpc medalclient.Medal
}

func NewCheckMedalMiddleware(rpc medalclient.Medal) *CheckMedalMiddleware {
	return &CheckMedalMiddleware{
		MedalRpc: rpc,
	}
}

func (m *CheckMedalMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 尝试从 Context 获取，进行类型断言校验
		walletVal := r.Context().Value("wallet")
		walletAddr, ok := walletVal.(string)
		if !ok || walletAddr == "" {
			logx.WithContext(r.Context()).Error("Unauthorized: JWT Context 中缺少 wallet 信息")
			http.Error(w, "未授权访问", http.StatusUnauthorized)
			return
		}

		// 统一转小写，增加容错
		walletAddr = strings.ToLower(strings.TrimSpace(walletAddr))

		// 调用 RPC
		resp, err := m.MedalRpc.GetMedalsByAddress(r.Context(), &medalclient.GetMedalsReq{
			Address: walletAddr,
		})

		// 区分“服务错误”和“权限不足”
		if err != nil {
			logx.WithContext(r.Context()).Errorf("RPC 查验勋章失败: %v", err)
			http.Error(w, "服务器忙，请稍后再试", http.StatusInternalServerError)
			return
		}

		if resp == nil || len(resp.Medals) == 0 {
			logx.WithContext(r.Context()).Infof("门控拦截: 地址 %s 无勋章", walletAddr)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"code": 403,
				"msg":  "专属资源门控生效！请先前往 Course DAO 领取创世勋章解锁本课程。",
			})
			return
		}

		// 放行
		logx.WithContext(r.Context()).Infof("门控放行: 地址 %s 校验通过", walletAddr)
		next(w, r)
	}
}
