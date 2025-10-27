# prebuild config
#FROM node:20-bookworm-slim
FROM node:20-alpine AS base

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./

# Use clean install and omit dev deps for smaller image
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]
#CMD ["node", "server.js"]