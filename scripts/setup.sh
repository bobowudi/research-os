#!/bin/bash
# ==================== ResearchOS 初始化脚本 ====================
set -e

echo "🚀 ResearchOS 项目初始化..."

# 1. 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 2. 复制环境变量
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ 已创建 .env 文件（请根据需要修改配置）"
else
  echo "⏭️  .env 已存在，跳过"
fi

# 3. 启动 Docker 服务
echo ""
echo "🐳 启动 Docker 服务..."
cd docker
docker-compose up -d
cd ..

# 等待 TiDB 启动
echo "⏳ 等待 TiDB 启动..."
for i in {1..30}; do
  if docker-compose -f docker/docker-compose.yml exec -T tidb mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
    echo "✅ TiDB 已就绪"
    break
  fi
  sleep 2
  echo "   等待中... ($i/30)"
done

# 4. 创建数据库
echo ""
echo "🗄️  创建数据库..."
docker-compose -f docker/docker-compose.yml exec -T tidb mysql -u root -e "CREATE DATABASE IF NOT EXISTS research_os;"
echo "✅ 数据库 research_os 已创建"

# 5. 运行迁移
echo ""
echo "📊 运行数据库迁移..."
npm run db:migrate

# 6. 插入种子数据（可选）
read -p "是否插入演示数据？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run db:seed
fi

echo ""
echo "✅ 初始化完成！"
echo ""
echo "运行以下命令启动开发环境："
echo "  npm run dev"
echo ""
echo "访问地址："
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:3001"
echo "  邮件: http://localhost:8025 (MailHog)"
echo ""
