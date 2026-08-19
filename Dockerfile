FROM mcr.microsoft.com/playwright:v1.45.0-jammy

# Install python3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Set Playwright browser path to a globally readable location
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm install

# Install Python dependencies and download Chromium browser
RUN pip3 install pandas playwright && python3 -m playwright install chromium

# Copy source code
COPY . .

EXPOSE 10000

CMD ["node", "server.cjs"]
