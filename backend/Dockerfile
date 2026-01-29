FROM node:20-alpine

# Install Docker CLI only (no daemon) so we can talk to a remote host
RUN apk add --no-cache docker-cli

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]