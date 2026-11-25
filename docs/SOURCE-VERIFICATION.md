# 第二阶段：新闻源核查报告

核查日期：2026-11-25  
状态：公开条款桌面核查持续进行；GitHub Actions XML 技术测试尚未执行。  
重要：本报告是初步技术与公开条款核查，不构成法律意见，也不代表已取得任何内容授权。

## 1. 结论摘要

目前**没有任何新闻媒体来源获准用于自动采集和再发布**。公开 RSS 入口只说明可订阅，不代表允许复制、改编或商业再发布。

本轮新增发现：土耳其卫生部开放数据平台发布了明确的 Attribution License 1.0，允许该平台明确纳入许可的数据集在遵守署名等条件下复制、发布、分发和改编。该许可只覆盖平台标注为许可数据的数据集，不能扩张解释为卫生部网站新闻稿、照片或其他网页内容的通用转载授权。

土耳其文化和旅游部公开提供 RSS 目录，但其网站使用条件限制未经许可复制、发布、翻译及商业使用。因此仍不接入。

首批新闻自动发布源暂定为 **0 个**。后续可先做不保存正文、不发布内容的 Feed 协议测试；所有候选配置默认 disabled。

## 2. 来源核查明细

| 来源 | 官方入口 / Feed | 使用条款初查 | 当前决定 |
|---|---|---|---|
| TRT Haber | https://www.trthaber.com/sitene_ekle.html；示例 https://www.trthaber.com/manset_articles.rss | 条款对站内文字、图片、视频等复制、引用、跨平台使用作严格限制；RSS 页面未授予再发布许可 | 暂不采集/发布，先取得书面许可 |
| Habertürk | https://www.haberturk.com/rss/anasayfa；示例 https://www.haberturk.com/rss/manset.xml | 条款限制未经书面许可的自动批量抓取、数据挖掘及 AI 训练，并对引用设限 | 暂不采集/发布，先取得书面许可 |
| T.C. Dışişleri Bakanlığı | https://www.mfa.gov.tr/rss.tr.mfa | 官方 RSS 入口列出公告、最新动态、部长声明等；入口页未明确授予自动再发布权 | 候选待确认；可用于人工事实核验，不镜像全文 |
| T.C. Kültür ve Turizm Bakanlığı | RSS 目录：https://www.ktb.gov.tr/TR-98488/sitemizde-yer-alan-rss-linkleri.html | 官方提供 RSS，但网站条款称未经许可不得复制、发布或翻译内容，商业使用受限；网页信息/Feed 不等于转载许可 | 不接入，除非取得书面授权 |
| T.C. Sağlık Bakanlığı Açık Veri | 平台：https://acikveri.saglik.gov.tr/；许可：https://acikveri.saglik.gov.tr/app/doc/TermOfUse.pdf | 平台公开 Attribution License 1.0；仅适用于平台明确标记为 licensed 的数据集，需署名并遵守完整条款；不覆盖一般新闻稿或图片 | **开放数据候选**；逐数据集核对许可标记、字段与用途后才能启用；当前不作为新闻 Feed |
| Anadolu Ajansı (AA) | https://www.aa.com.tr/tr/p/yasal-uyari | 法律声明要求使用其新闻内容须签订订阅合同；无合同不得使用新闻、图片和影像 | 排除首批免费来源；取得合同并确认费用后再评估 |
| Türkiye Ulusal Ajansı | https://www.ua.gov.tr/kurumsal/yasal-uyari-metni/ | 条款限制未经书面许可的复制、发布、分发、翻译及商业用途 | 不接入，除非取得书面许可 |
| NTV、Sözcü、Hürriyet、Sabah、Milliyet、CNN Türk | 尚未完成逐家官方入口核查 | 未核实 | 不接入 |

## 3. 技术可用性测试边界

本轮通过官方网页确认 TRT Haber、Habertürk、外交部和文化旅游部存在 RSS 目录/入口。网页读取工具不能展示 XML/RSS 内容，不代表 Feed 失效。当前执行环境无法完成这些站点的真实 HTTP 请求，因此不能报告 HTTP 状态码、XML 解析成功率、条目数量、更新时间或稳定性。

后续应在 GitHub Actions 手动触发的测试工作流中记录：
- HTTP 状态码、最终 URL、Content-Type、响应字节数
- XML 是否可解析，根节点是 RSS 还是 Atom
- 条目标题、链接、发布时间字段是否存在（只记录必要元数据）
- 时间字段时区、稳定 ID / URL、重复率
- 超时、速率限制、4xx / 5xx 情况

在来源许可状态不是 approved 时，测试只验证协议结构，不保存新闻正文、不生成摘要、不发布。工作流先采用手动触发，不添加每 30 分钟生产 cron。

## 4. 首批来源策略

1. 优先寻找明确开放许可的数据集、正式开放 API，以及明确允许 syndication 的官方渠道。
2. 对卫生部开放数据，只选取平台明确标记在 Attribution License 1.0 下的数据集；记录具体数据集许可、署名要求和版本。不得把数据集许可扩展到新闻稿、图片或第三方材料。
3. 对外交部 RSS，确认公告文本转载/摘要、署名、链接、归档和商业使用条件。
4. 联系 TRT Haber / Habertürk，询问是否允许每 30 分钟读取 RSS 标题、URL、发布时间和有限描述，并在网站展示原创摘要及来源链接。
5. AA 不纳入免费来源假设；只有取得订阅合同并确认费用后重新评估。
6. 至少一个来源明确获准前，不启用生产自动发布。

## 5. 官方核查链接

- TRT Haber RSS：https://www.trthaber.com/sitene_ekle.html
- TRT Haber 使用条款：https://www.trthaber.com/kullanim-sartlari.html
- Habertürk RSS：https://www.haberturk.com/rss/anasayfa
- Habertürk 使用条件：https://www.haberturk.com/kullanimkosullari
- 外交部 RSS：https://www.mfa.gov.tr/rss.tr.mfa
- 文化和旅游部 RSS：https://www.ktb.gov.tr/TR-98488/sitemizde-yer-alan-rss-linkleri.html
- 文化和旅游部网站使用条件：https://www.ktb.gov.tr/TR-96808/site-kullanim-kosullari-yasal-uyari.html
- 卫生部开放数据许可：https://acikveri.saglik.gov.tr/app/doc/TermOfUse.pdf
- AA 法律声明：https://www.aa.com.tr/tr/p/yasal-uyari
- 土耳其国家机构（Ulusal Ajans）使用条款：https://www.ua.gov.tr/kurumsal/yasal-uyari-metni/
