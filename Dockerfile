# 后端 Dockerfile
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm（与 frontend packageManager 对齐）
RUN npm install -g pnpm@9.8.0

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN pnpm install

# 复制项目源代码
COPY . .

# prisma generate 仅需合法占位连接信息，构建阶段不连真实数据库
ENV NODE_ENV=production \
    DATABASE_USER=root \
    DATABASE_PASSWORD=dummy \
    DATABASE_NAME=demo1 \
    DATABASE_HOST=localhost \
    DATABASE_PORT=3306

# 生成 Prisma Client 并构建项目
RUN pnpm exec prisma generate && pnpm run build && pnpm prune --prod

# 运行阶段
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 配置 Alpine 镜像源（使用阿里云镜像，加快下载速度）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 更新包索引并安装 wget、时区数据、openssl
RUN apk update && \
    apk add --no-cache wget tzdata openssl

# 设置时区为上海（Asia/Shanghai）
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 创建非 root 用户（安全最佳实践）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 从构建阶段复制产物（含已 prune 的生产依赖与 Prisma Client）
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Shanghai

# 启动应用
CMD ["node", "dist/src/main"]
