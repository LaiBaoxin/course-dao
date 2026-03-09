// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package handler

import (
	"github.com/wwater/course-dao/app/medal/api/internal/logic/medal"
	"net/http"

	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetMedalDetailHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MedalDetailReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := medal.NewGetMedalDetailLogic(r.Context(), svcCtx)
		resp, err := l.GetMedalDetail(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
