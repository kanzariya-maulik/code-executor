FROM node 

COPY . .

RUN npm install

EXPOSE 3001

RUN npm run build

CMD ["npm","start"]