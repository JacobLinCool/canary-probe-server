FROM node:lts-alpine as build-stage

WORKDIR /app
RUN npm i -g pnpm
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm run build
RUN pnpm pkg delete scripts.prepare && rm -rf node_modules && pnpm install --production

FROM node:lts-alpine as production-stage

WORKDIR /app
COPY --from=build-stage /app/build ./build
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/package.json ./package.json
CMD [ "node", "build" ]
