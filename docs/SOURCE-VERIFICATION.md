# 第二阶段：新闻源核查报告

核查日期：2026-11-25  
状态：桌面核查完成；尚未进行 GitHub Actions 运行环境中的 XML 解析与持续稳定性测试。  
重要：本报告是技术与公开条款的初步核查，不构成法律意见，也不代表已获得任何内容授权。

## 1. 结论摘要

目前确认存在官方 RSS 目录的媒体有 TRT Haber、Habertürk；土耳其外交部提供官方 RSS 入口。**但目前没有任何媒体来源被批准用于自动采集和再发布。**

原因是公开 RSS 入口与内容使用许可是两回事：

- TRT Haber 的公开使用条款对站内文字、图片、视频等内容的复制、引用、再次发布和商业使用作出严格限制；RSS 页面本身没有授予新闻再发布许可。
- Habertürk 条款明确限制未经书面许可的自动批量抓取、数据挖掘、复制、处理和重新发布。
- Anadolu Ajansı（AA）的法律声明明确要求新闻网站使用其新闻内容须签订订阅合同；无合同不得使用其新闻、图片和影像内容。
- 外交部 RSS 是官方公告来源候选，但其 RSS 入口页不是明确的再发布授权。需在正式接入前确认公告文本的使用条件、署名与链接要求。

因此，首批自动发布源暂定为 **0 个**，直到取得许可或确认存在适用的明确授权。可以继续完成不涉及复制内容的技术验证与样例解析，但不能把这些媒体 Feed 直接用于生产内容发布。

## 2. 来源核查明细

| 来源 | 官方 RSS 入口 | 官方 Feed 信息 | 使用条款初查 | 当前决定 |
|---|---|---|---|---|
| TRT Haber | https://www.trthaber.com/sitene_ekle.html | 官方页面列出多个 RSS，如 https://www.trthaber.com/manset_articles.rss、https://www.trthaber.com/sondakika_articles.rss、https://www.trthaber.com/gundem_articles.rss | 使用条款称站内文字、图片、视频等内容权利归 TRT，并限制复制、引用、跨平台使用；未发现 RSS 再发布授权 | **暂不采集/发布**；先向 TRT 确认 Feed 使用范围 |
| Habertürk | https://www.haberturk.com/rss/anasayfa | 官方页面列出 Manşet、Tüm Haberler、Ekonomi、Spor、Gündem、Dünya 等 RSS | 使用条款第 8 条限制未经书面许可的自动批量抓取/数据挖掘及 AI 训练；第 9 条对引用设定严格条件 | **暂不采集/发布**；先取得书面许可 |
| T.C. Dışişleri Bakanlığı | https://www.mfa.gov.tr/rss.tr.mfa | 官方 RSS 入口列出 Güncel Duyurular、Güncel Gelişmeler、Güncel Bakanlık Açıklamaları等频道 | 页面介绍 RSS 用途，但未在该入口页找到明确的自动再发布许可 | **候选待确认**；优先仅用于官方事实核验，不镜像全文 |
| Anadolu Ajansı (AA) | https://www.aa.com.tr/tr/kurumsal-haberler/guvenilir-haberin-kaynagi-aa-her-an-yaninizda/1403899 | AA 公开页面提及 RSS；另有旧 XML 帮助页，但不能据此认定旧接口仍适用 | AA 法律声明明确要求网站发布其新闻须与 AA 签订订阅合同；无合同不得使用其新闻、图片、视频 | **排除首批采集**；只有签订许可合同后再评估 |
| NTV | 暂未找到可确认的官方 RSS 目录 | 未验证 | 未核实 | **不接入** |
| 其他媒体（Sözcü、Hürriyet、Sabah、Milliyet、CNN Türk） | 尚未完成逐家官方入口和条款核查 | 未验证 | 未核实 | **不接入** |

## 3. 技术可用性测试边界

本轮已从官方页面确认 TRT Haber 与 Habertürk 确实公开列出 RSS 地址。通过网页读取工具直接打开 Feed 时，工具因 XML / RSS MIME 类型而未能展示 Feed 内容；这不是 Feed 不存在或服务器故障的证据。

当前执行环境的网络 DNS 也无法访问这些站点，因此本轮不能诚实地报告 HTTP 状态码、XML 解析成功率、条目数量或最近更新时间。上述项目必须在后续 GitHub Actions 测试工作流中用真实 HTTP 客户端验证。

下一轮技术测试应记录：

- HTTP 状态码、最终 URL、Content-Type、响应字节数
- XML 是否可解析，根节点是 RSS 还是 Atom
- 最近 20 条条目的标题、链接、发布时间字段是否齐全（只在测试日志中记录必要元数据）
- 条目时间是否为 UTC、是否有时区
- 同一条目跨两次运行的稳定 ID / URL 是否一致
- 请求频率限制、超时和 4xx / 5xx 情况
- Feed 的条款许可状态是否为 approved

在条款状态不是 approved 时，测试只验证协议结构，不保存新闻正文，不生成摘要，不发布。

## 4. 建议的首批来源策略

1. 先联系 TRT Haber / Habertürk，询问是否允许每 30 分钟获取其 RSS 的标题、URL、发布时间和有限描述，并在商业网站上展示 AI 生成的原创摘要及来源链接；询问是否有 RSS 专用许可或媒体合作条款。
2. 对外交部 RSS，确认公告文本的转载/摘要、署名、链接、归档和商业使用条件。
3. AA 不纳入免费来源假设；只有取得书面订阅合同并确认费用后才重新评估。
4. 同时寻找明确提供开放数据许可或明确允许 syndication 的政府与公共机构来源。
5. 在至少一个来源获得明确使用许可前，不启用生产自动发布。

## 5. 官方核查链接

- TRT Haber RSS 目录：https://www.trthaber.com/sitene_ekle.html
- TRT Haber 使用条款：https://www.trthaber.com/kullanim-sartlari.html
- Habertürk RSS 目录：https://www.haberturk.com/rss/anasayfa
- Habertürk 使用条件：https://www.haberturk.com/kullanimkosullari
- 土耳其外交部 RSS 入口：https://www.mfa.gov.tr/rss.tr.mfa
- AA 法律声明：https://www.aa.com.tr/tr/p/yasal-uyari
- AA 关于 RSS / 订阅服务的说明：https://www.aa.com.tr/tr/kurumsal-haberler/guvenilir-haberin-kaynagi-aa-her-an-yaninizda/1403899
