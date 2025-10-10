# 多分类文件上传与预览系统

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue.js">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
</div>

## 项目简介

一个多分类文件上传与预览系统，支持大文件分片上传、断点续传以及多种格式文件的在线预览。该系统采用前后端分离架构，前端使用Vue 3 + Element Plus构建，后端使用Node.js + Express实现。

## 功能特性

### 📁 文件分片上传
- 支持大文件分片上传，提高上传效率和稳定性
- 默认分片大小为1MB，可根据需要调整
- 支持断点续传功能，网络中断后可继续上传

### 🔐 文件唯一性校验
- 通过读取文件前2M、中间2M和最后2M内容生成文件hash
- 确保相同文件不会重复上传，节省存储空间

### 👁️ 多格式文件在线预览
- **图片格式**：JPG、PNG、GIF、BMP、WebP、SVG
- **视频格式**：MP4、AVI、MOV、WMV、FLV、WebM、MKV等
- **音频格式**：MP3、WAV、OGG、M4A、AAC、FLAC等

### 🎯 技术亮点
- 前后端分离架构，代码结构清晰
- 使用TypeScript提升代码质量和开发体验
- 基于Element Plus的现代化UI界面
- 支持拖拽上传和文件信息展示
- 实时上传进度显示

## 技术栈

### 前端
- Vue 3 (Composition API)
- TypeScript
- Element Plus UI组件库
- Vite构建工具
- SparkMD5 (文件hash计算)

### 后端
- Node.js
- Express.js
- TypeScript
- Multer (文件上传中间件)
- Pug (模板引擎)

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- pnpm >= 7.0.0

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

启动后，您可以通过以下地址访问：
- 主页：http://localhost:3000
- 前端上传页面：http://localhost:5173
- 文件资源页面：http://localhost:3000/assets

### 构建生产版本
```bash
pnpm build
```

## 项目结构

```
➜  mulit-category-upload tree            
.
├── README.md
├── index.html
├── package.json
├── patches
│   └── rolldown-vite@7.1.14.patch
├── pnpm-lock.yaml
├── public
│   └── vite.svg
├── server
│   ├── assets.pug
│   ├── home.pug
│   ├── index.ts
│   └── upload
│       
├── src
│   ├── App.vue
│   ├── fileUtils.ts
│   ├── main.ts
│   └── useUpload.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── upload-web.html
└── vite.config.ts
```

## 核心功能详解

### 1. 文件分片上传流程
1. 用户选择文件后，前端会读取文件并生成唯一hash值
2. 将文件按1MB大小分割成多个分片
3. 逐个上传分片到服务器
4. 所有分片上传完成后，发送合并请求
5. 服务器将分片按顺序合并成完整文件

### 2. 断点续传机制
- 上传前检查服务器已存在的分片
- 只上传缺失的分片，避免重复上传
- 提高大文件上传效率和成功率

### 3. 文件预览功能
- 根据文件扩展名判断文件类型
- 图片文件支持放大预览
- 视频和音频文件支持在线播放
- 自动适配不同格式的MIME类型

## API接口

### 上传相关
- `POST /upload` - 上传文件分片
- `POST /upload/merge` - 合并文件分片
- `GET /upload/chunks` - 获取已上传的分片信息

### 资源相关
- `GET /assets` - 获取所有上传文件列表
- `GET /assets/:filename` - 访问上传的文件

## 配置说明

### 上传配置
- 分片大小：默认1MB，可在`src/App.vue`中修改`chunkSize`变量
- 上传目录：默认为`server/upload`，可在`server/index.ts`中修改`UPLOAD_DIR`常量

### 支持的文件格式
系统支持预览的文件格式包括：
- 图片：jpg/jpeg, png, gif, bmp, webp, svg
- 视频：mp4, avi, mov, wmv, flv, webm, mkv, mpeg, mpg, m4v, 3gp, ogv
- 音频：mp3, wav, ogg, m4a, aac, flac, wma, aiff

## 开发指南

### 添加新的文件格式支持
1. 在`server/index.ts`的`mimeTypes`对象中添加新的MIME类型映射
2. 在`server/assets.pug`的预览函数中添加新的格式判断
3. 在`server/index.ts`的文件类型判断中添加新的正则表达式

### 自定义UI样式
- 前端样式：修改`src/App.vue`中的`<style>`部分
- 后端页面样式：修改对应的`.pug`文件中的`<style>`部分

## 常见问题

### 1. 上传大文件时出现超时
解决方案：在`server/index.ts`中增加请求超时时间设置

### 2. 某些视频格式无法播放
解决方案：确保已在`server/index.ts`中正确配置该格式的MIME类型

### 3. 文件预览显示空白
解决方案：检查浏览器控制台错误信息，确认文件路径和MIME类型是否正确

### 4. 文件PNPM补丁
> pnpm patch rolldown-vite@7.1.14
>
> pnpm patch-commit /Users/shenyandu/Desktop/mulit-category-upload/node_modules/.pnpm_patches/rolldown-vite@7.1.14


## 联系方式

如果您有任何问题或建议，请通过以下方式联系我们：
- 提交Issue
- 发送邮件至项目维护者：[dushenyan88@gmail.com](mailto:shenyandu@outlook.com)

---
> 该项目仅供学习和参考使用
</markdown>
