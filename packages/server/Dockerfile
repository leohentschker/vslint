# Use Alpine-based Node.js image
FROM node:alpine

# Set the working directory for the app
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the current directory
COPY ./package*.json ./

RUN npm install

# Copy the application code
COPY . .

RUN npm install tsup typescript --save-dev

# Build the TypeScript code
RUN npm run build

# Expose port 8080
EXPOSE 8080

# Command to run the compiled Express server
CMD ["node", "dist/app.js"]