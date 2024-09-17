# Use Alpine-based Node.js image
FROM node:18-bullseye

# Set the working directory for the app
WORKDIR /usr/src/app

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Verify Chrome installation
RUN google-chrome-stable --version && \
    ls -l /usr/bin/google-chrome-stable

# Copy package.json and package-lock.json from the current directory
COPY ./package*.json ./

RUN npm install

# Copy the application code
COPY . .

# Install tsup and typescript to build
RUN npm install tsup typescript --save-dev

# Install winston for logging
RUN npm install winston

# Install the shared types package
RUN npm install ../shared

# Build the TypeScript code
RUN npm run build

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Expose port 8080
EXPOSE 8080

# Command to run the compiled Express server
CMD ["node", "dist/app.js"]