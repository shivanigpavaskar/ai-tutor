# ==== Build Stage for Frontend ====
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ==== Production Stage for Backend ====
FROM node:22-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
EXPOSE 3002
CMD ["node", "server.js"]

# ==== Production Stage for Frontend (Nginx) ====
FROM nginx:alpine AS frontend
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
