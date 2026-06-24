# Stage 1: Build the frontend
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build the vite app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html
# Expose port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
