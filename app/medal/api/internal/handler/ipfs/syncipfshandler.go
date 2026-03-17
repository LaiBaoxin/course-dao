// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package ipfs

import (
	"github.com/wwater/course-dao/app/medal/api/internal/logic/ipfs"
	"net/http"

	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func SyncIPFSHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.SyncIPFSReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := ipfs.NewSyncIPFSLogic(r.Context(), svcCtx)
		resp, err := l.SyncIPFS(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
