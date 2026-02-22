# Этап 1: Сборка фронтенда
FROM node:20-alpine AS build

WORKDIR /app

# Устанавливаем pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Аргументы сборки (передаются через --build-arg)
ARG BUILD_SALT
ARG SIGNING_SECRET
ARG HCAPTCHA_SECRET

# Переменные окружения для vite build
ENV BUILD_SALT=${BUILD_SALT}
ENV SIGNING_SECRET=${SIGNING_SECRET}
ENV HCAPTCHA_SECRET=${HCAPTCHA_SECRET}

# Собираем фронтенд
RUN pnpm build

# Этап 2: Production BFF-сервер
FROM node:20-alpine AS production

WORKDIR /app

# Копируем BFF-сервер
COPY server/package.json ./

# Устанавливаем зависимости BFF
RUN npm install --omit=dev

COPY server/index.js ./

# Копируем собранный фронтенд
COPY --from=build /app/dist ./dist

# Переменные окружения (можно переопределить при запуске)
ENV PORT=3000
ENV API_TARGET=https://api.relics.pw-hub.ru
ENV SITE_URL=https://relics.pw-hub.ru
ENV HCAPTCHA_SECRET=""
ENV NODE_ENV=production

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/pow-challenge || exit 1

CMD ["node", "index.js"]
