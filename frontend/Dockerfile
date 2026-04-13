FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Vite inlines VITE_* at build time; runtime container env does not change the bundle.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build 

EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
