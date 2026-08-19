FROM mcr.microsoft.com/playwright:v1.45.0-jammy

# Install python3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm install

# Install Python dependencies
RUN pip3 install pandas playwright

# Copy source code
COPY . .

EXPOSE 10000

CMD ["node", "server.cjs"]
