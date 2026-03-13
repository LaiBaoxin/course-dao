// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package governance

import (
	"net/http"

	"github.com/wwater/course-dao/app/course/internal/logic/governance"
	"github.com/wwater/course-dao/app/course/internal/svc"
	"github.com/wwater/course-dao/app/course/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetProposalHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ProposalDetailReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := governance.NewGetProposalLogic(r.Context(), svcCtx)
		resp, err := l.GetProposal(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
