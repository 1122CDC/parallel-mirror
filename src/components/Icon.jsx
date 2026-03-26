/**
 * 🎯 Icon 组件 · 统一图标注册表
 * 所有 Lucide 图标在此集中映射，App.jsx 通过 name 属性调用。
 */
import {
  LucideHome,
  LucideSettings,
  LucideHistory,
  LucideGlobe,
  LucideMessageCircle,
  LucideMessageSquare,
  LucideTrash2,
  LucideSparkles,
  LucidePlusCircle,
  LucideChevronRight,
  LucideZap,
  LucideCoins,
  LucideBrain,
  LucideHeart,
  LucideFlame,
  LucideUser,
} from 'lucide-react';

const icons = {
  home: LucideHome,
  settings: LucideSettings,
  timeline: LucideHistory,
  world: LucideGlobe,
  chat: LucideMessageCircle,
  message: LucideMessageSquare,
  trash: LucideTrash2,
  sparkles: LucideSparkles,
  plus: LucidePlusCircle,
  chevron: LucideChevronRight,
  zap: LucideZap,
  // --- 以下为补全的缺失图标 ---
  coins: LucideCoins,
  brain: LucideBrain,
  heart: LucideHeart,
  fire: LucideFlame,
  user: LucideUser,
};

export const Icon = ({ name, size = 20, className = "" }) => {
  const LucideIcon = icons[name] || LucideSparkles;
  return <LucideIcon size={size} className={className} />;
};
