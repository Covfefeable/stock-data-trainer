# Stock Data Trainer

这是一个基于TensorFlow.js的股票数据训练和预测项目，可以在浏览器端进行模型训练和预测，支持多种预测模型和技术指标。

本项目为前端，如果需要访问服务端，请前往[服务端项目](https://github.com/Covfefeable/stock-data-collector)

## 功能特点

- 支持多种预测模型（LSTM、Dense等）
- 内置多种技术指标（SMA、RSI、EMA等）
- 支持自定义因子
- 实时模型训练和预测
- 可视化训练过程和预测结果
- 支持多股票数据联合训练

## 技术栈

- 前端框架：Vue 3 + TypeScript
- UI组件：Ant Design Vue
- 构建工具：Vite
- 机器学习：TensorFlow.js
- 数据可视化：ECharts
- 状态管理：Pinia
- 代码编辑器：Monaco Editor

## 项目结构

```
src/
  ├── assets/        # 静态资源
  ├── components/    # 公共组件
  ├── fetch/         # API请求
  ├── pages/         # 页面组件
  │   ├── factor/    # 因子管理
  │   ├── login/     # 登录页面
  │   ├── overview/  # 概览页面
  │   └── train/     # 训练页面
  ├── router/        # 路由配置
  ├── store/         # 状态管理
  └── utils/         # 工具函数
```

## 使用说明

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 开发环境运行：
   ```bash
   pnpm dev
   ```

3. 生产环境构建：
   ```bash
   pnpm build
   ```

## 开发指南

### 模型训练

项目支持多种预测模型，包括：
- Classic LSTM：适用于时序预测
- Classic Dense：适用于特征组合预测

### 因子管理

支持自定义因子，可以通过编写JavaScript代码来实现自定义技术指标和预测因子。

### 数据预处理

内置多种技术指标计算，支持数据标准化和自定义数据处理流程。
