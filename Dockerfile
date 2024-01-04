# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.10.0
ARG PNPM_VERSION=8.12.1

# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Install pnpm.
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy package.json so that package manager commands can be used.
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy the rest of the source files into the image.
COPY . .

# RUN the prisma generate script.
RUN pnpm prisma generate

# Run the build script.
RUN pnpm run build

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 5000

# Run the application.
CMD pnpm start