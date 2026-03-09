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

func GetMedalsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetMedalsReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := medal.NewGetMedalsLogic(r.Context(), svcCtx)
		resp, err := l.GetMedals(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
