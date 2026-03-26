/**
 * 🧠 AI 推演服务 · DeepSeek V3 引擎
 * 负责与 DeepSeek API 通信，支持纯文本和 JSON 两种返回格式。
 * 内置重试逻辑（最多3次），防止网络抖动导致推演崩溃。
 */

const DEEPSEEK_API_KEY = "sk-e66926b7a07e44a4904095e2501cca5c";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// 默认系统提示词
const DEFAULT_SYSTEM_PROMPT = "你是一个充满智慧、洞察人性的'平行人生推演引擎'。你的任务是基于用户给出的初始条件，推演出一段逻辑自洽、细节丰富、具有'真实感'的人生片段。请注意：1. 语言要平实、生活化，像大哥说话一样，不要堆砌华丽辞藻；2. 逻辑要严密，前后的因果关系要对得上。";

// 最大重试次数
const MAX_RETRIES = 3;

/**
 * 调用 DeepSeek AI
 * @param {string} prompt - 用户提示词
 * @param {boolean} isJSON - 是否期望 JSON 返回（true=解析JSON，false=返回纯文本）
 * @returns {Promise<string|object>} AI 返回内容
 */
export async function fetchAI(prompt, isJSON = false) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: DEFAULT_SYSTEM_PROMPT },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API 错误: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // 如果需要 JSON，尝试解析
      if (isJSON) {
        try {
          // 尝试提取 JSON 块（兼容 ```json ... ``` 格式）
          const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            return JSON.parse(jsonStr);
          }
          return JSON.parse(content);
        } catch (parseErr) {
          console.warn(`[第${attempt}次] JSON 解析失败，使用降级文本:`, parseErr.message);
          // 降级：返回纯文本而非崩溃
          if (attempt === MAX_RETRIES) return { story: content, impact: {} };
        }
      }

      return content;
    } catch (error) {
      lastError = error;
      console.warn(`[第${attempt}次] AI推演请求失败:`, error.message);
      if (attempt < MAX_RETRIES) {
        // 等待后重试（指数退避）
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  console.error("AI推演最终失败:", lastError);
  // 最终降级：返回安全的默认值
  if (isJSON) return { story: "（AI暂时无法连接，推演已暂停）", impact: {} };
  return "（AI暂时无法连接）";
}
