FROM node:20-alpine

WORKDIR /app

# Copy package files from client
COPY client/package*.json ./
RUN npm install

# Copy react code
COPY client/ ./

EXPOSE 5173

# Vite needs --host flag to expose to container network
CMD ["npm", "run", "dev", "--", "--host"]
