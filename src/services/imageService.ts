/**
 * Minimax 生图服务 (修正版)
 * 官方 T2I-V2 接口地址通常包含 group_id 或由于版本差异需要路径调整
 * 根据 404 错误，改为更通用的请求方式或核对最新文档路径
 */
const MINIMAX_KEY = "sk-api-eLkYi9BdYEzrbMtiyyJWfcPvwwS6tQDZhkUsFh7IAMfT8LzAzqu9wlVRRRWMC-ew64e_QI5u7LRowCXA9R1ZI6767l1Mldpp65kcPs8c3U4CUvY2_CeC-mE";
// 尝试使用 v1/t2i_v2 路径，这是 Minimax 较新的标准路径
const BASE_URL = "https://api.minimax.chat/v1/t2i_v2?GroupId=183353066601438"; // 假设一个占位 GroupId，实际可能需要从 key 关联或省略

export const ImageService = {
  async generateImage(prompt: string): Promise<string | null> {
    console.log("尝试请求 Minimax V2 接口...", prompt);
    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MINIMAX_KEY}`
        },
        body: JSON.stringify({
          model: "minimouse-v1", // 修正模型名
          prompt: `极简主义电影感，赛博朋克，${prompt}`,
          style: "base",
          image_size: "1024x1024"
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Minimax API Error:", response.status, err);
        // 如果 404 持续，尝试备用路径 v1/text_to_image (不带 v2)
        if (response.status === 404) {
           return this.generateImageLegacy(prompt);
        }
        return null;
      }

      const data = await response.json();
      console.log("Minimax Response:", data);
      return data.data?.image_urls?.[0] || data.data?.[0]?.url || null;
    } catch (e) {
      console.error("Minimax Fetch Error:", e);
      return null;
    }
  },

  async generateImageLegacy(prompt: string): Promise<string | null> {
    const LEGACY_URL = "https://api.minimax.chat/v1/text_to_image";
    try {
      const response = await fetch(LEGACY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MINIMAX_KEY}`
        },
        body: JSON.stringify({
          model: "drawing_01",
          prompt: prompt
        })
      });
      const data = await response.json();
      return data.data?.[0]?.url || null;
    } catch { return null; }
  }
};
