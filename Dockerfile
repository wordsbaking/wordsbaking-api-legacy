FROM node:9.6.1

WORKDIR /wordsbaking-api

ADD yarn.lock /wordsbaking-api/yarn.lock
ADD package.json /wordsbaking-api/package.json

RUN yarn install --registry https://registry.npm.taobao.org

ADD bld /wordsbaking-api/bld
ADD data /wordsbaking-api/data
ADD .env.docker /wordsbaking-api/.env

EXPOSE 80

ENV NODE_ENV production
ENV PORT 80

CMD ["node", "bld/main.js"]
