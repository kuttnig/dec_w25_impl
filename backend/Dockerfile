FROM node:22.18.0-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 5172

ENV NODE_ENV=docker

CMD ["npm", "run", "dev"]
