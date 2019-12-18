FROM node:12-alpine

RUN mkdir -p /opt && mkdir -p /opt/charts

ADD . /opt/charts

WORKDIR /opt/charts

RUN npm install && npm run client:build

CMD ["node", "./server/index.js"]
