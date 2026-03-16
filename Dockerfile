FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci --prefix backend --omit=dev

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

CMD ["npm", "--prefix", "backend", "start"]
