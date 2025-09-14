# Farert WebAssembly Development Environment
# Includes Node.js, Emscripten, TypeScript, and all necessary build tools

FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install system dependencies for C++ compilation and WebAssembly
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        build-essential \
        cmake \
        ninja-build \
        python3-pip \
        curl \
        wget \
        git \
        ca-certificates \
        xz-utils \
        bzip2 \
        file \
        sqlite3 \
        libsqlite3-dev \
    && apt-get autoremove -y && apt-get clean -y

# Install Emscripten SDK
USER vscode
WORKDIR /home/vscode

# Download and install Emscripten
RUN git clone https://github.com/emscripten-core/emsdk.git \
    && cd emsdk \
    && ./emsdk install latest \
    && ./emsdk activate latest

# Set up environment variables for Emscripten
ENV EMSDK="/home/vscode/emsdk"
ENV PATH="${EMSDK}:${EMSDK}/upstream/emscripten:${PATH}"
RUN echo 'source /home/vscode/emsdk/emsdk_env.sh' >> ~/.bashrc

# Install global npm packages for development
RUN npm install -g \
    typescript \
    @typescript-eslint/eslint-plugin \
    @typescript-eslint/parser \
    prettier \
    eslint \
    vite \
    @vitejs/plugin-react \
    @sveltejs/vite-plugin-svelte

# Verify installations
RUN node --version \
    && npm --version \
    && python3 --version \
    && /home/vscode/emsdk/upstream/emscripten/emcc --version

# Set working directory
WORKDIR /workspace

# Copy package files if they exist (will be overridden by mount)
COPY package*.json ./

# Install project dependencies (will be run again in postCreateCommand)
RUN npm install || echo "No package.json found, skipping npm install"

# Create helpful aliases and shortcuts
RUN echo 'alias ll="ls -la"' >> ~/.bashrc \
    && echo 'alias emscripten-env="source /home/vscode/emsdk/emsdk_env.sh"' >> ~/.bashrc \
    && echo 'alias build-wasm="source /home/vscode/emsdk/emsdk_env.sh && make node"' >> ~/.bashrc \
    && echo 'alias build-cli="npm run cli:build"' >> ~/.bashrc \
    && echo 'alias test-cli="npm run cli:exec"' >> ~/.bashrc \
    && echo 'export EMSDK_QUIET=1' >> ~/.bashrc

# Set default shell to bash
ENV SHELL=/bin/bash