import React from 'react'
import ReactDOM from 'react-dom/client'
import { initializeApp } from 'firebase/app';
import App from './App.jsx'
import './index.css'

// 大哥的 Firebase 配置 (从 index.html 同步)
const firebaseConfig = {
  apiKey: "AIzaSy...", // 这里应使用实际 Key，但报错显示 DEFAULT 没创建，通常是因为全量引入没调 initialize
  projectId: "hello-my-world-v8",
  storageBucket: "hello-my-world-v8.appspot.com",
  appId: "1:..."
};

try {
  initializeApp(firebaseConfig);
  console.log("Firebase 核心矩阵已激活");
} catch (e) {
  console.error("Firebase 初始化失败:", e);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
