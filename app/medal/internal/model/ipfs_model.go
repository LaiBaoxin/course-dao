package model

type MedalMetadata struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Image       string `json:"image"`        // 必须是 ipfs://CID 格式
	ExternalURL string `json:"external_url"` // 课程网站
	Attributes  []Attr `json:"attributes"`   // 勋章属性（等级、权重等）
}

type Attr struct {
	TraitType string      `json:"trait_type"`
	Value     interface{} `json:"value"`
}
