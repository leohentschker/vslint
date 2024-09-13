# Use Alpine-based Node.js image
FROM node:alpine

# Set the working directory for the app
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from two levels up
COPY ../../package*.json ./

# Install dependencies from two levels up
RUN npm install

# Copy package.json and package-lock.json from the current directory
COPY ./package*.json ./

# Install dependencies from the current directory
# Use --prefix to avoid overwriting the previous node_modules
RUN npm install

# Copy the application code
COPY . .

# Expose port 8080
EXPOSE 8080

# Command to run the compiled Express server
CMD ["node", "dist/app.js"]