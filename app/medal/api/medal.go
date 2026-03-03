// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package main

import (
	"flag"
	"fmt"

	"github.com/wwater/course-dao/app/medal/api/internal/config"
	"github.com/wwater/course-dao/app/medal/api/internal/handler"
	"github.com/wwater/course-dao/app/medal/api/internal/svc"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"
)

var configFile = flag.String("f", "etc/medal-api.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	// 允许前端 Vite 的 5173 端口跨域访问
	server := rest.MustNewServer(c.RestConf, rest.WithCors("http://localhost:5173"))
	defer server.Stop()

	ctx := svc.NewServiceContext(c)
	handler.RegisterHandlers(server, ctx)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
