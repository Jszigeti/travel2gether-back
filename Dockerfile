FROM node:22-alpine

WORKDIR /app

RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

COPY package.json ./

COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

RUN mkdir -p dist/uploads && cp -r uploads dist/uploads

EXPOSE 3000

CMD ["npm", "run", "start:migrate:prod"]