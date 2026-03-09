// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package auth

import (
	"context"
	"errors"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/golang-jwt/jwt/v4"
	"time"

	"github.com/wwater/course-dao/app/medal/api/internal/svc"
	"github.com/wwater/course-dao/app/medal/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type LoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewLoginLogic 钱包签名登录
func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LoginLogic) Login(req *types.LoginReq) (resp *types.LoginResp, err error) {
	// 验证以太坊签名
	if !verifySignature(req.Address, req.Message, req.Signature) {
		l.Errorf("地址 %s 签名验证失败！", req.Address)
		return nil, errors.New("无效的签名")
	}

	// 签名验证通过，开始生成 JWT
	now := time.Now().Unix()
	accessExpire := l.svcCtx.Config.Auth.AccessExpire

	// 准备 Payload (Claims)
	claims := make(jwt.MapClaims)
	claims["exp"] = now + accessExpire
	claims["iat"] = now
	// 把用户的钱包地址存进 Token 里
	claims["wallet"] = req.Address

	token := jwt.New(jwt.SigningMethodHS256)
	token.Claims = claims

	// 使用配置文件中的秘钥进行签名
	secretKey := []byte(l.svcCtx.Config.Auth.AccessSecret)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		l.Errorf("生成 JWT 失败: %v", err)
		return nil, err
	}

	l.Infof("地址 %s 登录成功，下发 Token", req.Address)

	return &types.LoginResp{
		Token: tokenString,
	}, nil
}

// verifySignature 解析并验证 MetaMask 的个人签名
func verifySignature(walletAddress, message, signatureHex string) bool {
	// 补齐 EIP-191 标准前缀
	fullMessage := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	hash := crypto.Keccak256Hash([]byte(fullMessage))

	// 解码 Hex 格式的签名
	signature, err := hexutil.Decode(signatureHex)
	if err != nil || len(signature) != 65 {
		return false
	}

	// 处理以太坊签名的 recovery ID
	if signature[64] >= 27 {
		signature[64] -= 27
	}

	// 从哈希和签名中恢复公钥
	sigPublicKey, err := crypto.SigToPub(hash.Bytes(), signature)
	if err != nil {
		return false
	}

	// 将公钥转换为以太坊地址
	recoveredAddress := crypto.PubkeyToAddress(*sigPublicKey).Hex()

	// 比对恢复出的地址和前端传来的地址 (忽略大小写)
	return common.HexToAddress(recoveredAddress) == common.HexToAddress(walletAddress)
}
