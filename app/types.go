package app

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

type App struct {
	ConfigFile string
	Config     *Config
	Router     *gin.Engine
	RedisCli   *RedisCli
	SortPrizes []*Prize
	PrizeList  []*Prize
	AllChance  int32
}

type Config struct {
	Addr   string   `yaml:"Addr"`
	Admin  *Admin   `yaml:"Admin"`
	Prizes []*Prize `yaml:"Prizes"`
}

type Prize struct {
	Id     int    `yaml:"Id"`     // 对应的前端产品列表的 index
	Name   string `yaml:"Name"`   // 礼品名称
	Image  string `yaml:"Image"`  // 礼品图片
	Chance int32  `yaml:"Chance"` // 运气值
	Win    bool   `yaml:"Win"`    //中獎了
}

type Admin struct {
	Username string `yaml:"Username"`
	Password string `yaml:"Password"`
}

var jwtSecret = []byte("planttitle.com")

type Claims struct {
	UserId uint
	jwt.StandardClaims
}

type TokenInfo struct {
	Token     string    `json:"Token"`
	ExpiresAt time.Time `json:"ExpiresAt"`
}

type LoginReq struct {
	UserName  string `json:"Username"`
	Password  string `json:"Password"`
	AutoLogin bool   `json:"AutoLogin"`
}

// ShortlinkInfo short_link info
type ShortlinkInfo struct {
	Status    bool   `json:"Status"`    //状态
	Count     int    `json:"Count"`     //已抽次数
	ShortKey  string `json:"ShortKey"`  //凭证
	ShortLink string `json:"ShortLink"` //短链接后缀
	Prize     *Prize `json:"Prize"`     //中奖产品信息
	LuckDate  string `json:"LuckDate"`  //抽奖日期
	CreatedAt string `json:"CreatedAt"` //创建日期
}

type GenLinkReq struct {
	ShortKey string `json:"ShortKey"`
}
