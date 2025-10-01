FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install

COPY server/ .

RUN mkdir -p uploads/competitions uploads/profiles

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "index.js"]
