# prebuild config
FROM node:20-bookworm-slim

# Use development env so devDependencies (postcss, tailwind, etc.) are installed for next dev
ENV NODE_ENV=development
WORKDIR /app

COPY package*.json ./

# Use clean install 
RUN npm ci 

COPY . .

CMD ["npm","run","dev","--","-p","5173","-H","0.0.0.0"]
#CMD ["node", "server.js"]