# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY server/ .

# Create uploads directory
RUN mkdir -p uploads/competitions uploads/profiles

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "index.js"]
