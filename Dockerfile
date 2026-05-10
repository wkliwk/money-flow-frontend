# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./

# ---- Dev (hot-reload with Vite) ----
FROM base AS dev
RUN yarn install --frozen-lockfile
COPY tsconfig.json vite.config.ts index.html ./
# src/ and public/ are volume-mounted in docker-compose for hot-reload
EXPOSE 3000
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "3000"]

# ---- Build ----
FROM base AS build
RUN yarn install --frozen-lockfile
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
ARG VITE_API_URL
ARG VITE_VERSION
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_VERSION=${VITE_VERSION}
RUN yarn build

# ---- Production ----
FROM nginx:alpine AS prod
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
