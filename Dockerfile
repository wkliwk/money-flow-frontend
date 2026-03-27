# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./

# ---- Dev (hot-reload with react-scripts) ----
FROM base AS dev
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
# src/ and public/ are volume-mounted in docker-compose for hot-reload
EXPOSE 3000
CMD ["yarn", "start"]

# ---- Build ----
FROM base AS build
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
COPY public ./public
COPY src ./src
ARG REACT_APP_API_URL
ARG REACT_APP_VERSION
RUN yarn build

# ---- Production ----
FROM nginx:alpine AS prod
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
