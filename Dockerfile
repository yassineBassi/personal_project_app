FROM public.ecr.aws/docker/library/node:23-alpine AS builder

ARG APP_NAME
WORKDIR /app
COPY package.json package-lock.json ./

RUN npm ci

COPY . .
RUN npm run build $APP_NAME

FROM public.ecr.aws/docker/library/node:23-alpine

ARG APP_NAME
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/apps/$APP_NAME ./dist

CMD ["node", "dist/main.js"]