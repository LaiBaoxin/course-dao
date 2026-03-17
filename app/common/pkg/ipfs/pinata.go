package ipfs

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

type PinataClient struct {
	ApiKey    string
	ApiSecret string
}

// NewPinataClient 初始化
func NewPinataClient(apiKey, apiSecret string) *PinataClient {
	return &PinataClient{
		ApiKey:    apiKey,
		ApiSecret: apiSecret,
	}
}

// setPinataHeaders 内部私有方法：统一设置鉴权头
func (p *PinataClient) setPinataHeaders(req *http.Request) {
	req.Header.Set("pinata_api_key", p.ApiKey)
	req.Header.Set("pinata_secret_api_key", p.ApiSecret)
}

// UploadFile 上传勋章图片到 IPFS
func (p *PinataClient) UploadFile(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("打开文件失败: %v", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// 创建表单文件
	part, err := writer.CreateFormFile("file", filePath)
	if err != nil {
		return "", err
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return "", err
	}
	writer.Close()

	req, _ := http.NewRequest("POST", "https://api.pinata.cloud/pinning/pinFileToIPFS", body)
	// 使用 APIKey 鉴权
	p.setPinataHeaders(req)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Pinata 返回错误: %s", string(respBody))
	}

	var result struct {
		IpfsHash string `json:"IpfsHash"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return result.IpfsHash, nil
}

// UploadJSON 上传元数据 (Metadata) 到 IPFS
func (p *PinataClient) UploadJSON(data interface{}) (string, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	req, _ := http.NewRequest("POST", "https://api.pinata.cloud/pinning/pinJSONToIPFS", bytes.NewBuffer(jsonData))
	// 使用 APIKey 鉴权
	p.setPinataHeaders(req)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Pinata JSON 上传失败")
	}

	var result struct {
		IpfsHash string `json:"IpfsHash"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return result.IpfsHash, nil
}
