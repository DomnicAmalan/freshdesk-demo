# FreshDesk Demo

## Requirements

To run the FreshDesk Demo, ensure the following dependencies are installed and configured:

### 1. **PostgreSQL**
   - A running PostgreSQL database is required for storing application data.
   - **Environment Variables**:
     ```bash
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=postgres
     POSTGRES_DB=postgres
     POSTGRES_HOST=localhost
     POSTGRES_PORT=5432
     ```

### 2. **NestJS**
   - The application is built using NestJS. Ensure Node.js and NestJS CLI are installed.
   - **Installation**:
     ```bash
     npm install -g @nestjs/cli
     ```

### 3. **Ollama or OpenAI API Key**
   - **Ollama**:
     - A running Ollama instance is required for local LLM functionality.
     - **Environment Variables**:
       ```bash
       OLLAMA_BASE_URL=http://localhost:11434
       LLM_MODEL_VERSION=mistral:latest
       ```
   - **OpenAI**:
     - Alternatively, provide an OpenAI API key for cloud-based LLM functionality.
     - **Environment Variables**:
       ```bash
       OPENAI_API_KEY=your_openai_api_key
       ```

### 4. **Redis**
   - Redis is used for caching and queue management.
   - **Environment Variables**:
     ```bash
     REDIS_HOST=localhost
     REDIS_PORT=6379
     ```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/freshdesk-demo.git
   cd freshdesk-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env` or `.env.docker`:
   ```bash
   cp .env.example .env
   ```

4. Start the application:
   ```bash
   npm run start:dev
   ```

5. Access the application at `http://localhost:3034`.

## Todo

1. Docker fix for Ollama
2. Create a repetitive flow between agents and customers
3. Create Groups, Companies, and utilize that

