# Use the official Node.js 20 image.
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# We need to install dependencies first, so we copy over the package files
# and install them before copying the rest of the code. This takes advantage
# of Docker's layer caching.
COPY server/package.json server/package-lock.json* ./

# Install dependencies
# Using --production will not install devDependencies
RUN npm install --production

# Copy the rest of the server-side application code
COPY server/ ./

# The PORT environment variable will be set by Fly.io.
# Our app in server/index.js uses process.env.PORT.
# The internal_port in fly.toml is where the Fly proxy sends requests.
# The app needs to listen on this port. Fly sets PORT to match internal_port.
# We don't need to EXPOSE it here as Fly handles it, but it's good practice.
EXPOSE 8080

# The command to start the server
CMD ["npm", "start"] 