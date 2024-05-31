# Set the default OS to Linux
ARG OS=linux

# Use the official Node.js image as base
FROM node:21

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the container at /app
COPY package*.json ./

# Bundle the app source inside the Docker image 
# (i.e., copy the rest of the application into the Docker image)
COPY . .

# Install any needed packages specified in package.json
RUN npm install

# Install dependencies in the vendor directory (only for Windows)
RUN if [ "$OS" = "windows" ]; then \
    cd /app/vendor && npm install; \
  fi

# Install dependencies in the font directory (only for Windows)
RUN if [ "$OS" = "windows" ]; then \
    cd /app/fonts && npm install; \
  fi

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run MagicMirror² when the container launches, using the server only mode
CMD ["npm", "run", "server"]