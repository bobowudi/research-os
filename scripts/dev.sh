#!/bin/bash
# ==================== ResearchOS 开发启动脚本 ====================
set -e

echo "🚀 启动 ResearchOS 开发环境..."

# 检查 Docker 服务
echo "🐳 检查 Docker 服务..."
cd docker
if ! docker-compose ps | grep -q "Up"; then
  echo "   启动 Docker 容器..."
  docker-compose up -d
else
  echo "   ✅ Docker 服务已运行"
fi
cd ..

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
fi

# 并行启动前后端
echo ""
echo "🖥️  启动开发服务器..."
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo ""

# 使用 npm workspace 并行启动
npm run dev
