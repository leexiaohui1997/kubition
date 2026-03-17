# M0: 项目初始化

## 📋 里程碑目标

搭建完整的开发环境，创建可运行的空项目框架。

**工期:** 0.5 天 (半天)
**前置:** 无
**输出:** 可运行的空项目

---

## ✅ 任务清单

### 1. 项目初始化

```bash
# 使用 Vite 创建项目
npm create vite@latest kubition-remake -- --template react-ts

# 进入项目目录
cd kubition-remake

# 安装核心依赖
npm install zustand framer-motion

# 安装开发依赖
npm install -D tailwindcss postcss autoprefixer

# 初始化 Tailwind
npx tailwindcss init -p
```

### 2. 目录结构创建

```bash
mkdir -p src/{components/{layout,scenes,ui},store,data,systems,hooks,utils,types}
mkdir -p public
```

### 3. 配置文件修改

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mud-bg': '#1a1a2e',
        'mud-bg-secondary': '#16213e',
        'mud-bg-tertiary': '#0f3460',
        'mud-text': '#ecf0f1',
        'mud-text-dim': '#95a5a6',
        'mud-accent': '#e94560',
        'mud-success': '#27ae60',
        'mud-warning': '#f39c12',
        'mud-info': '#3498db',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

**tsconfig.json 路径别名:**
```json
{
  "compilerOptions": {
    // ... 其他配置
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/store/*": ["src/store/*"],
      "@/data/*": ["src/data/*"],
      "@/utils/*": ["src/utils/*"]
    }
  }
}
```

### 4. 样式文件设置

**src/index.css:**
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-mud-bg text-mud-text font-mono;
  }
}

@layer components {
  .mud-panel {
    @apply border border-mud-bg-tertiary bg-mud-bg-secondary p-4;
  }
  
  .mud-btn {
    @apply px-4 py-2 border border-mud-accent text-mud-accent 
           hover:bg-mud-accent hover:text-white transition-colors
           cursor-pointer select-none;
  }
  
  .mud-log {
    @apply text-mud-text-dim text-sm;
  }
}
```

### 5. 入口文件配置

**src/main.tsx:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**src/App.tsx (初始版本):**
```tsx
function App() {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-4 p-4 mud-panel">
          <h1 className="text-2xl font-bold text-mud-accent">
            超苦逼冒险者 - 复刻版
          </h1>
          <p className="text-mud-text-dim">MUD风格放置RPG</p>
        </header>
        
        <main className="mud-panel min-h-[400px]">
          <p className="text-center text-mud-text-dim mt-20">
            [项目初始化完成，等待开发...]
          </p>
        </main>
      </div>
    </div>
  );
}

export default App;
```

### 6. TypeScript 类型定义初始化

**src/types/index.ts:**
```typescript
// 基础游戏类型定义文件
// 后续会逐步填充

export interface GameState {
  version: string;
  startTime: number;
}

// 导出其他类型...
```

### 7. Git 初始化

```bash
# 初始化 git
git init

# 添加 .gitignore
echo "node_modules/
dist/
.vscode/
*.log" > .gitignore

# 提交初始版本
git add .
git commit -m "chore: M0 - 项目初始化完成"
```

---

## 🎯 验收标准

### 必须完成的检查项:

- [ ] `npm install` 能成功安装所有依赖
- [ ] `npm run dev` 能正常启动开发服务器
- [ ] 浏览器能访问 `http://localhost:5173`
- [ ] 页面显示「超苦逼冒险者 - 复刻版」标题
- [ ] 页面使用暗色主题
- [ ] 页面使用等宽字体
- [ ] Git 仓库已初始化且有首次提交

### 验证命令:

```bash
# 1. 安装依赖
npm install

# 2. 类型检查
npx tsc --noEmit

# 3. 启动开发服务器
npm run dev

# 4. 构建测试
npm run build
```

---

## 📁 里程碑输出结构

```
kubition-remake/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── layout/
│   │   ├── scenes/
│   │   └── ui/
│   ├── store/
│   ├── data/
│   ├── systems/
│   ├── hooks/
│   ├── utils/
│   └── types/
│       └── index.ts
├── public/
└── node_modules/
```

---

## 🚀 下一步

完成本里程碑后，进入 **M1: 数据层设计**

查看: [m01_data_design.md](./m01_data_design.md)

---

*里程碑文档 v1.0 | M0 | 2026-03-17*
