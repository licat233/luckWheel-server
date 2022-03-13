package app

import (
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func (a *App) AuthMiddleware(ctx *gin.Context) {
	ok, err := a.auth(ctx)
	if err != nil {
		ctx.JSON(200, ServerError(err))
		ctx.Abort()
	}
	if ok {
		ctx.Next()
	} else {
		ctx.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "權限不足,請先登錄"})
		ctx.Abort()
	}
}

func (a *App) InitializeRouters() {
	logfile, _ := os.Create("gin.log")
	gin.DefaultWriter = io.MultiWriter(logfile)
	gin.SetMode(gin.ReleaseMode)
	a.Router = gin.Default()
	// a.Router.Use(cors()) //ReleaseMode模式不需要
	a.Router.Use(gin.Logger())
	a.Router.Use(gin.Recovery())
	a.Router.GET("/", nonepage)
	a.Router.GET("/luck", nonepage)
	a.Router.Static("/luck/static", "./static")
	a.Router.Static("/luck/static1", "./luckview/client")
	a.Router.StaticFile("/luck/login", "./view/login.html")
	a.Router.StaticFile("/luck/admin", "./view/admin.html")
	a.Router.LoadHTMLFiles("./luckview/client/index.html")
	a.Router.GET("/luck/admin/reset", a.resetConfig)
	a.Router.GET("/luck/:shortlink", a.luckpage)
	a.Router.POST("/luck/prizes", a.getprizes)
	a.Router.POST("/luck/login/verify", a.loginVerify)
	a.Router.POST("/luck/:shortlink/goodluck", a.goodluck)
	a.Router.POST("/luck/:shortlink/info", a.shortlinkpage)
	a.Router.POST("/luck/logout", a.AuthMiddleware, a.logout)
	a.Router.POST("/luck/admin/genlink", a.AuthMiddleware, a.genlinkapi)
	a.Router.POST("/luck/admin/shortlinks", a.AuthMiddleware, a.shortlinks)
}

func (a *App) Initialize() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	a.ConfigFile = "./config.yaml"
	a.setConfig()
	a.RedisCli = &RedisCli{}
	a.RedisCli.InitializeRedis()
	a.InitializeRouters()
}

func (a *App) Run() {
	gin.ErrorLogger()
	log.Fatal(a.Router.Run(a.Config.Addr))
}

func nonepage(ctx *gin.Context) {
	ctx.JSON(200, gin.H{
		"message": "404頁面",
	})
}

// func cors() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		method := c.Request.Method
// 		c.Header("Access-Control-Allow-Origin", "*")
// 		c.Header("Access-Control-Allow-Headers", "Content-Type,AccessToken,X-CSRF-Token, Authorization, Token")
// 		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
// 		c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type")
// 		c.Header("Access-Control-Allow-Credentials", "true")
// 		if method == "OPTIONS" {
// 			c.AbortWithStatus(http.StatusNoContent)
// 		}
// 		c.Next()
// 	}
// }
