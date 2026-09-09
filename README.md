# SmartQuant AI

A 股量化策略回测与 AI 诊断平台。基于 React 19 + Vite + Express 构建，内置确定性回测引擎、参数网格挖掘、Gemini 驱动的策略诊断与优化代码生成。

## 功能特性

- **策略编辑器**：Monaco 编辑器，`initialize(context)` + `handle_data(context, data)` 范式，内置 5 套预设策略（双均线 / RSI / 布林带 / ATR 止损 / 多因子）
- **回测引擎**：纯前端运行，支持 A 股规则（整手交易、印花税仅卖出、佣金、滑点、次日开盘撮合，无未来函数）
- **K 线图与回放**：买卖点标记、多周期切换（1D/60m/15m/5m）、逐 Bar 策略信号回放
- **评估仪表盘**：20+ 项绩效指标（夏普 / Sortino / Alpha / Beta / 最大回撤 / 胜率 / 盈亏比 / 摩擦比等）、交易明细、策略动作流
- **参数网格挖掘**：2D 参数穷举热力图，自动识别稳健高原区与孤立过拟合尖峰，按策略类型自动映射可调参数
- **AI 策略诊断**：Gemini 分析策略漏洞（未来函数 / 过拟合 / 过度交易），一键应用优化代码（未配置 API key 时自动降级为内置规则诊断）
- **K 线数据中心**：4 套预设行情场景（牛/熊/震荡/高频）、自定义 CSV 导入导出
- **回测配置**：初始资金、日期区间、撮合模式、佣金 / 印花税 / 滑点

## 快速开始

**环境要求：** Node.js 18+

```bash
# 1. 安装依赖
npm install

# 2. （可选）配置 Gemini API Key 以启用 AI 诊断
cp .env.example .env
# 编辑 .env，填入你的 GEMINI_API_KEY

# 3. 启动开发服务器
npm run dev
```

访问 http://localhost:3999

## 生产部署

```bash
npm run build   # 构建 dist/ 与 dist/server.cjs
npm start       # 启动生产服务器
```

## 数据说明

当前内置的个股 K 线、沪深300 基准与预设行情均为**确定性伪随机合成的模拟数据**，用于教学与策略逻辑验证。接入真实数据请通过「K线数据中心 → CSV 导入」上传（格式：`Date,Open,High,Low,Close,Volume`）。唯一外部 API 为 Gemini（AI 诊断/问答）。

详细使用说明见 [使用说明书.md](使用说明书.md)。

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS 4 · Monaco Editor · Express · @google/genai (gemini-3.7-flash)
