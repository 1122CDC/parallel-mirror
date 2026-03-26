/**
 * AI 服务 (DeepSeek 强力驱动)
 */
const API_CONFIG = {
  key: "sk-e66926b7a07e44a4904095e2501cca5c",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat"
};

/**
 * 核心 AI 调用函数
 */
export async function fetchAI(prompt: string, isJson: boolean = true): Promise<any> {
    console.log("AI 请求开始 -> ", prompt.substring(0, 30) + "...");
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.key}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: "system", content: isJson ? "你是一个精准的数据生成器，只返回合法的 JSON 对象。不要有任何多余文字。" : "你是一个人生模拟专家，请用平实、感性但不过分夸张的文字进行描述。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            console.error("DeepSeek API 出错:", await response.text());
            return null;
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        if (isJson) {
            try {
                // 自动清理 AI 可能返回的 Markdown 代码块标签
                const cleanContent = content.replace(/```json|```/g, '').trim();
                return JSON.parse(cleanContent);
            } catch (e) {
                console.error("JSON 解析失败:", content);
                return null;
            }
        }
        return content;
    } catch (e) {
        console.error("网络请求异常:", e);
        return null;
    }
}
