FROM 547323802553.dkr.ecr.us-east-1.amazonaws.com/node:latest AS builder

ARG APP_NAME
WORKDIR /app
COPY package.json package-lock.json ./

RUN npm install

COPY . .
RUN npm run build $APP_NAME

FROM 547323802553.dkr.ecr.us-east-1.amazonaws.com/node:latest

ARG APP_NAME
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist/apps/$APP_NAME ./dist

CMD ["node", "dist/main.js"]