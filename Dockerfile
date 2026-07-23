# 后端 Dockerfile（生产多阶段构建）
FROM node:20-alpine AS builder

WORKDIR /app

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
  && apk add --no-cache openssl

RUN npm install -g pnpm@9.8.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# prisma generate 仅需合法占位连接信息，不连真实数据库
ENV NODE_ENV=production \
    DATABASE_USER=root \
    DATABASE_PASSWORD=dummy \
    DATABASE_NAME=demo1 \
    DATABASE_HOST=localhost \
    DATABASE_PORT=3306

# 生成 Prisma Client 并构建 NestJS
RUN pnpm exec prisma generate && pnpm run build && pnpm prune --prod

# ---------- 运行阶段 ----------
FROM node:20-alpine

WORKDIR /app

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
  && apk add --no-cache wget tzdata openssl \
  && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo "Asia/Shanghai" > /etc/timezone \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001

COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Shanghai

CMD ["node", "dist/src/main"]
