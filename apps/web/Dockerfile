FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN npm install

RUN npm run build --workspace=@dzencode/contracts
RUN npm run build --workspace=@dzencode/web

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@dzencode/web"]
