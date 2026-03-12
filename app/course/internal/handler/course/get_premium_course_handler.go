// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package course

import (
	"net/http"

	"github.com/wwater/course-dao/app/course/internal/logic/course"
	"github.com/wwater/course-dao/app/course/internal/svc"
	"github.com/wwater/course-dao/app/course/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetPremiumCourseHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CourseReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := course.NewGetPremiumCourseLogic(r.Context(), svcCtx)
		resp, err := l.GetPremiumCourse(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
