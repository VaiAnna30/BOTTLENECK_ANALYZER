# Stage 1: Build the C++ Engine
FROM gcc:12 as cpp-builder
WORKDIR /app
COPY algorithm/dinic.cpp ./algorithm/dinic.cpp
RUN mkdir -p backend/engine
RUN g++ algorithm/dinic.cpp -o backend/engine/dinic_engine -O3

# Stage 2: Node Backend
FROM node:20-bullseye-slim
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ ./
# Copy the compiled engine from stage 1
COPY --from=cpp-builder /app/backend/engine/dinic_engine ./engine/dinic_engine
RUN chmod +x ./engine/dinic_engine

EXPOSE 5000
CMD ["npm", "start"]
