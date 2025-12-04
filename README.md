# Money Manager - AI Chatbot Integration

## Overview

The Smart Money Management and Financial Analysis Tool is designed to help students and early-stage professionals manage their money more effectively.
It simplifies the process of tracking expenses, managing budgets, monitoring debts, and gaining financial insights through an intelligent chatbot.

This tool supports users who are just starting their careers and learning how to balance expenses, debt payments, and savings. It brings clarity and organization to personal finance through automatic expense categorization, debt tracking, and AI-based insights that empower users to make smarter financial decisions.

### Key Stakeholders

- Students and early-career professionals who need help managing their finances.  
- Educational institutions that want to promote financial literacy.

### Value Proposition

- Automates expense tracking and categorization.  
  * Example: Automatically groups expenses like rent, groceries, and bills.  
- Creates a user-friendly experience through a conversational chatbot.  
  * Example: Lets users ask natural questions like “How much did I spend on food this month?”


## Features

1. Expense Monitoring & Categorization
Automatically logs and categorizes spending (groceries, rent, utilities, entertainment) so users can easily see where their money goes each month.

2. Budgeting & Notifications
Allows users to set budgets for each spending category and receive alerts when spending nears or exceeds limits.

3. Debt Management Module
Tracks student loans and other debts, calculates interest, estimates payoff dates, and sends reminders before due dates.

4. Analytics & Chatbot
Provides an interactive dashboard and an AI-powered chatbot with multiple open-source models that answers financial questions, summarizes spending, and gives personalized recommendations.

**AI Model Options:**
- **Llama 3.2 1B** (1.3GB) - Lightning quick, basic accuracy (default)
- **Llama 3.2 3B** (2.0GB) - Balanced speed & intelligence

5. Report Generation
Generates clean, downloadable reports in PDF or Excel summarizing monthly or yearly financial activity.

6. Account & Data Protection
Ensures all sensitive data is encrypted and protected with multi-factor authentication (MFA).


## Authors & Contributors

* **Project Team:** Group 10  
* **Course:** CompSci 520  


## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB
- Ollama (for AI chatbot features)

### Installation

1. **Install Dependencies**
   ```bash
   # Server
   cd server
   npm install
   
   # Client
   cd ../client
   npm install
   ```
   
2. **Install Ollama** (for AI features)
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Windows
   # Download from https://ollama.com/download
   ```

3. **Pull AI Models**
   ```bash
   # Default model - lightweight and fast (1.3GB)
   ollama pull llama3.2:1b
   
   # Optional: Better accuracy (2.0GB)
   ollama pull llama3.2:3b
   ```

4. **Configure Environment Variables**
   
   Create `server/.env`:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/expense-tracker
   CLIENT_URL=http://localhost:5173
   JWT_SECRET= <Input your preffered key>
   NODE_ENV=development
   OLLAMA_API_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2:1b
   ```
   
   Create `client/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5001/api
   VITE_APP_NAME=Money Manager
   VITE_APP_VERSION=1.0.0
   ```

5. **Start the Application**
   ```bash
   # Start Ollama (in a separate terminal)
   ollama serve
   
   # Start MongoDB (if not running as service)
   mongod
   
   # Start server (in server directory)
   npm start
   
   # Start client (in client directory)
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## AI Chatbot Features

### Operating Modes

The chatbot offers two intelligent modes:

| Mode | Description |
|------|-------------|
| **Basic Mode** | Rule-based responses for quick data queries |
| **Advanced Mode** | AI-powered natural language using Ollama for complex questions and personalized advice |

**Toggle Modes:** Click the power toggle in the chatbot header to switch between modes.

---

### Model Selection

Choose from 2 AI models in Advanced mode:

- **Llama 3.2 1B** (1.3GB) - Fastest responses, basic accuracy (default)
- **Llama 3.2 3B** (2.0GB) - Balanced speed & intelligence

**How to Switch:** Click the model dropdown in the header.

---

### Financial Data Integration

The AI has **real-time access** to your financial data:
- All expenses with categories and amounts
- Income streams and sources
- Budget limits and progress
- Debt balances and interest rates
- Account balances
- Spending patterns and trends

The AI provides recommendations based on your actual financial situation.

---

### Example Conversations

**Balance & Money Queries:**
```
User: "How much money do I have?"
Bot: Shows total balance with account breakdown
```

**Budget Questions:**
```
User: "How's my budget this month?"
Bot: Analyzes budget data and spending patterns
```

**Debt Management:**
```
User: "Check my debts"
Bot: Lists all debts with balances and due dates
```

**Purchase Decisions:**
```
User: "Can I afford a $5000 car?"
Bot: Calculates available funds and provides recommendation
```

**Financial Insights:**
```
User: "Where should I cut expenses?"
Bot: Identifies highest spending categories and suggests alternatives
```

---

### Troubleshooting

**"Ollama Not Running" Message:**
```bash
# Start Ollama service
ollama serve

# Or use brew on macOS
brew services start ollama
```

**Model Not Found:**
```bash
# Check installed models
ollama list

# Install missing model
ollama pull llama3.2:1b
```

**Slow Responses:**
- Use Llama 3.2 1B (default, fastest)
- Close other applications to free up RAM