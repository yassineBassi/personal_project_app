FROM public.ecr.aws/docker/library/node:21-alpine3.17 AS builder

ARG APP_NAME
WORKDIR /app
COPY package.json package-lock.json ./

RUN npm install

COPY . .
RUN npm run build $APP_NAME

FROM public.ecr.aws/docker/library/node:21-alpine3.17

ARG APP_NAME
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist/apps/$APP_NAME ./dist

CMD ["node", "dist/main.js"]