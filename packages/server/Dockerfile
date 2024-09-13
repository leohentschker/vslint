# Use Alpine-based Node.js image
FROM node:18-bullseye

# Set the working directory for the app
WORKDIR /usr/src/app

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    gconf-service \
    libappindicator1 \
    libasound2 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libfontconfig1 \
    libgbm-dev \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libicu-dev \
    libjpeg-dev \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpng-dev \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json from the current directory
COPY ./package*.json ./

RUN npm install

# Copy the application code
COPY . .

RUN npm install tsup typescript --save-dev

# Build the TypeScript code
RUN npm run build

# Install puppeteer dependencies
RUN npx puppeteer browsers install

# Expose port 8080
EXPOSE 8080

# Command to run the compiled Express server
CMD ["node", "dist/app.js"]