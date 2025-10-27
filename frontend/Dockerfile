# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
EXPOSE 3000
CMD ["npm","run","start","--","-p","3000"]
# # prebuild config
# FROM node:20-bookworm-slim

# # Use development env so devDependencies (postcss, tailwind, etc.) are installed for next dev
# ENV NODE_ENV=development
# WORKDIR /app

# COPY package*.json ./

# # Use clean install 
# RUN npm ci 

# COPY . .

# CMD ["npm","run","dev","--","-p","5173","-H","0.0.0.0"]
# #CMD ["node", "server.js"]