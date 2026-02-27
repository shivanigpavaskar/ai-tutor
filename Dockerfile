## Stage 1: build
FROM node:18-alpine AS build

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app

# install deps
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY .npmrc* ./
RUN if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent; fi

# copy rest and build
COPY . .
RUN npm run build

## Stage 2: serve with nginx
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# custom nginx config for SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["/usr/sbin/nginx", "-g", "daemon off;"]
