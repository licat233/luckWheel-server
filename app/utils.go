package app

import (
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

func IsPhoneNumber(s string) bool {
	if len(s) == 0 {
		return false
	}
	if ok, _ := regexp.MatchString("^\\d{6,15}$", s); ok {
		return true
	}
	return false
}

//颁发token
func setting(ctx *gin.Context, AutoLogin bool) (*TokenInfo, error) {
	expireTime := time.Now().Add(12 * time.Hour)
	if AutoLogin {
		expireTime = time.Now().Add(7 * 24 * time.Hour)
	}
	claims := &Claims{
		UserId: 1,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expireTime.Unix(), //过期时间
			IssuedAt:  time.Now().Unix(),
			Issuer:    "127.0.0.1",  // 签名颁发者
			Subject:   "user token", //签名主题
		},
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err := jwtToken.SignedString(jwtSecret)
	if err != nil {
		return nil, err
	}
	return &TokenInfo{Token: token, ExpiresAt: expireTime}, err
}

//解析token
func getting(ctx *gin.Context) *Claims {
	tokenString := ctx.GetHeader("Authorization")
	if tokenString == "" { // 權限不足,請先登錄
		return nil
	}

	token, claims, err := ParseToken(tokenString)
	if err != nil || !token.Valid { //權限不足,請重新登錄
		return nil
	}
	return claims
}

func ParseToken(tokenString string) (*jwt.Token, *Claims, error) {
	Claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, Claims, func(token *jwt.Token) (i interface{}, err error) {
		return jwtSecret, nil
	})
	return token, Claims, err
}
