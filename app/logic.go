package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis"
	"github.com/licat233/goutil/readfile"
)

func (a *App) auth(ctx *gin.Context) (bool, error) {
	if getting(ctx) == nil {
		return false, nil
	}
	tokenString := ctx.GetHeader("Authorization")
	has, err := a.RedisCli.Exists(fmt.Sprintf(BlackList, tokenString))
	if err != nil {
		return false, err
	}
	return !has, nil
}

//resetConfig 為了方便隨時重置配置，而不用重啟服務
func (a *App) resetConfig(ctx *gin.Context) {
	a.setConfig()
	ctx.JSON(200, gin.H{
		"code":    200,
		"message": "重置配置成功",
	})
}

//setConfig config文件映射
func (a *App) setConfig() {
	readfile.YamlConfig(a.ConfigFile, &a.Config, func(err error) {
		if err != nil {
			panic(err)
		}
	})
	var newPrizes = make([]*Prize, len(a.Config.Prizes))
	a.PrizeList = make([]*Prize, len(a.Config.Prizes))
	for _, p := range a.Config.Prizes {
		a.PrizeList[p.Id] = &Prize{
			Id:     p.Id,
			Name:   p.Name,
			Image:  p.Image,
			Chance: 0,
			Win:    p.Win,
		}
		newPrizes[p.Id] = p
	}
	a.Config.Prizes = newPrizes
	a.SortPrizes = append([]*Prize{}, a.Config.Prizes...)
	sort.Slice(a.SortPrizes, func(i, j int) bool {
		return a.SortPrizes[i].Chance < a.SortPrizes[j].Chance
	})
	a.AllChance = 0
	for _, v := range a.SortPrizes {
		a.AllChance += v.Chance
	}
}

func (a *App) luckpage(ctx *gin.Context) {
	eid := ctx.Param("shortlink")
	if len(eid) != 8 {
		ctx.JSON(400, gin.H{
			"code":    404,
			"message": "404頁面",
		})
		return
	}
	b, err := a.RedisCli.Exists(fmt.Sprintf(ShortlinkKey, eid))
	if err != nil {
		ctx.JSON(200, ServerError(err))
		return
	}
	if !b {
		ctx.JSON(400, gin.H{
			"code":    404,
			"message": "404頁面",
		})
		return
	}
	ctx.HTML(http.StatusOK, "index.html", nil)
}

func (a *App) getprizes(ctx *gin.Context) {
	ctx.JSON(200, gin.H{
		"code":    200,
		"message": "請求成功",
		"data":    a.PrizeList,
	})
}
func (a *App) loginVerify(ctx *gin.Context) {
	req := &LoginReq{}
	ctx.BindJSON(req)
	if req.UserName != a.Config.Admin.Username || req.Password != a.Config.Admin.Password {
		ctx.JSON(200, gin.H{
			"code":    401,
			"message": "賬號/密碼錯誤",
		})
		return
	}
	token, err := setting(ctx, req.AutoLogin)
	if err != nil {
		ctx.JSON(500, gin.H{
			"code":    500,
			"message": "jwt服务异常",
		})
		return
	}
	ctx.JSON(200, gin.H{
		"code":    200,
		"message": "登錄成功",
		"data":    token,
	})
}

func (a *App) shortlinks(ctx *gin.Context) {
	res, err := a.RedisCli.getUrls()
	if err == redis.Nil {
		ctx.JSON(200, gin.H{
			"code":    200,
			"message": "目前沒有數據",
		})
	} else if err != nil {
		ctx.JSON(200, gin.H{
			"code":    500,
			"message": "服務器出現錯誤",
		})
	} else {
		ctx.JSON(200, gin.H{
			"code":    200,
			"message": "請求成功",
			"total":   len(res),
			"data":    res,
		})
	}
}

func (a *App) shortlinkpage(ctx *gin.Context) {
	eid := ctx.Param("shortlink")
	if len(eid) != 8 {
		ctx.JSON(400, gin.H{
			"code":    404,
			"message": "404端口",
		})
		return
	}
	info, err := a.RedisCli.GetShortlinkInfo(eid)
	if err != nil {
		ctx.JSON(200, err)
		return
	}
	ctx.JSON(200, gin.H{
		"code":      200,
		"message":   "短链接信息",
		"shortlink": info,
	})
}

func (a *App) genlinkapi(ctx *gin.Context) {
	req := &GenLinkReq{}
	ctx.BindJSON(req)
	ShortKey := strings.TrimSpace(req.ShortKey)
	n := len(ShortKey)
	if n == 0 {
		ctx.JSON(200, gin.H{
			"code":    400,
			"message": "The request is missing a parameter",
		})
		return
	}
	if !IsPhoneNumber(ShortKey) {
		if n < 4 {
			ctx.JSON(200, gin.H{
				"code":    400,
				"message": "輸入lineID長度太短！！",
			})
			return
		} else if n > 10 {
			ctx.JSON(200, gin.H{
				"code":    400,
				"message": "輸入lineID長度過長！！",
			})
			return
		}
	} else {
		if n < 6 {
			ctx.JSON(200, gin.H{
				"code":    400,
				"message": "輸入電話號碼長度太短！！",
			})
			return
		} else if n > 15 {
			ctx.JSON(200, gin.H{
				"code":    400,
				"message": "輸入電話號碼長度過長！！",
			})
			return
		}
	}

	info, err := a.RedisCli.Shorten(ShortKey)
	if err != nil {
		ctx.JSON(200, gin.H{
			"code":    err.Status(),
			"message": err.Error(),
		})
		return
	}
	ctx.JSON(200, gin.H{
		"code":    200,
		"message": "短链接生成端口",
		"data":    info,
	})
}

func (a *App) goodluck(ctx *gin.Context) {
	//檢測是否被抽過
	eid := ctx.Param("shortlink")
	if len(eid) != 8 {
		ctx.JSON(404, gin.H{
			"code":    404,
			"message": "404端口",
		})
		return
	}
	info, err := a.RedisCli.GetShortlinkInfo(eid)
	if err != nil {
		ctx.JSON(200, err)
		return
	}
	if info.Status {
		ctx.JSON(200, gin.H{
			"code":     400,
			"message":  "抽獎次數已用完",
			"data":     info.Prize,
			"shortKey": info.ShortKey,
		})
		return
	}
	prize, e := a.RandomPrize()
	if e != nil {
		ctx.JSON(200, gin.H{
			"code":    500,
			"message": "服務器配置錯誤,請聯繫站點管理員",
			"error":   e.Error(),
		})
		return
	}
	info.Prize = prize
	info.Status = true
	info.Count += 1
	info.LuckDate = time.Now().String()
	infoStr, _ := json.Marshal(info)

	if e := a.RedisCli.Cli.Set(fmt.Sprintf(ShortlinkKey, eid), infoStr, 0).Err(); e != nil {
		fmt.Println(e)
		ctx.JSON(200, gin.H{
			"code":    500,
			"message": e.Error(),
		})
		return
	}
	msg := "感謝參與"
	if prize.Win {
		msg = fmt.Sprintf("運氣爆表！抽中了【%s】", prize.Name)
	}
	ctx.JSON(200, gin.H{
		"code":     200,
		"message":  msg,
		"data":     prize,
		"shortKey": info.ShortKey,
	})
}

func (a *App) RandomPrize() (*Prize, error) {
	if a.AllChance == 0 {
		return nil, errors.New("allChance == 0")
	}
	rand.Seed(time.Now().UnixNano())
	random := rand.Int31n(a.AllChance)
	temp := random
	for _, v := range a.SortPrizes {
		if random < v.Chance {
			return &Prize{
				Id:     v.Id,
				Name:   v.Name,
				Image:  v.Image,
				Chance: 0,
				Win:    v.Win,
			}, nil
		}
		random -= v.Chance
	}
	return nil, fmt.Errorf("allprob=%d,random=%d", a.AllChance, temp)
}

//logout 注销登录
func (a *App) logout(ctx *gin.Context) {
	tokenString := ctx.GetHeader("Authorization")
	claims := getting(ctx)
	now := time.Now()
	if claims.ExpiresAt-now.Unix() <= 0 {
		ctx.JSON(200, gin.H{
			"code":    200,
			"message": "當前登錄已過期，無需註銷",
		})
		return
	}
	tokenExp := time.Unix(claims.ExpiresAt, 0).Local()
	dataExp := tokenExp.Sub(now)
	err := a.RedisCli.Cli.Set(fmt.Sprintf(BlackList, tokenString), true, dataExp).Err()
	if err != nil {
		ctx.JSON(200, ServerError(err))
		return
	}
	ctx.JSON(200, gin.H{
		"code":    200,
		"message": "註銷成功",
	})
}
