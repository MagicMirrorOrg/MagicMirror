# Dockerfile for MagicMirror

# FROM node:21

FROM ubuntu:22.04

# Install Node.js and npm, keep the FROM to just one per dockerfile
RUN apt-get update && apt-get install -y curl software-properties-common
RUN curl -sL https://deb.nodesource.com/setup_21.x | bash -
RUN apt-get update && apt-get install -y nodejs

# Make sure to have x11-apps to perform screen forwarding
RUN apt-get update && apt-get install -qqy x11-apps

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libnss3 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libxss1 \
    libgbm1 \
    libxshmfence1 \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /opt/magicmirror

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY vendor/ ./vendor/
COPY fonts/ ./fonts/
RUN npm install --verbose

# Copy MagicMirror files
COPY . .

# Expose port
EXPOSE 8080

# Start MagicMirror in server mode
# CMD ["node", "serveronly"]

# Start MagicMirror in client mode
CMD ["npm", "start", "--", "--no-sandbox"]
