# Money Manager - Smart Financial Management Tool

> A comprehensive expense tracking and financial management application with AI-powered chatbot assistance for students and early-career professionals.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Node](https://img.shields.io/badge/node-v16%2B-green)]()
[![React](https://img.shields.io/badge/react-18.2-blue)]()
[![Vite](https://img.shields.io/badge/vite-7.2-646CFF)]()
[![MongoDB](https://img.shields.io/badge/mongodb-5%2B-green)]()

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📦 Prerequisites](#-prerequisites)
- [🚀 Quick Start](#-quick-start)
- [📖 Detailed Setup Instructions](#-detailed-setup-instructions)
- [🤖 AI Chatbot Setup](#-ai-chatbot-setup)
- [🏃 Running the Application](#-running-the-application)
- [📁 Project Structure](#-project-structure)
- [📜 Available Scripts](#-available-scripts)
- [🔐 Environment Variables](#-environment-variables)
- [🧪 Testing](#-testing)
- [👥 Authors](#-authors)

## 🎯 Overview

The **Money Manager** is designed to help students and early-stage professionals manage their finances effectively. It simplifies expense tracking, budget management, debt monitoring, and provides AI-powered financial insights through an intelligent chatbot.

### Key Benefits

- **Automated Expense Tracking**: Automatically categorizes expenses (rent, groceries, utilities, entertainment)
- **Smart Budgeting**: Set category-specific budgets with real-time alerts
- **Debt Management**: Track loans, calculate interest, and get payoff estimates
- **AI-Powered Insights**: Get personalized financial advice through conversational AI
- **Visual Analytics**: Interactive dashboards with spending trends and patterns
- **Report Generation**: Export financial summaries as PDF or Excel

### Target Users

- Students learning to manage their finances
- Early-career professionals balancing expenses and savings
- Anyone seeking better financial organization and insights

## ✨ Features

### 1. **Expense Monitoring & Categorization**

Automatically logs and categorizes all spending so you can see exactly where your money goes each month.

### 2. **Budgeting & Notifications**

Set custom budgets for each category and receive alerts when spending approaches or exceeds limits.

### 3. **Debt Management Module**

Track student loans and other debts with:

- Interest calculations
- Payoff date estimates
- Payment reminders

### 4. **AI-Powered Analytics & Chatbot**

Interactive dashboard with an AI chatbot that:

- Answers financial questions in natural language
- Provides spending summaries
- Offers personalized recommendations
- Supports multiple AI models (Llama 3.2 1B/3B)

### 5. **Report Generation**

Generate and download comprehensive financial reports in PDF or Excel format.

### 6. **Security & Data Protection**

- End-to-end encryption for sensitive data
- JWT-based authentication
- Secure password hashing with bcrypt
- Rate limiting and security headers

## 🛠 Tech Stack

### Frontend (Client)

- **React 18.2** - Modern UI library with hooks
- **Vite 7.2** - Lightning-fast build tool
- **React Router 6** - Client-side routing
- **TanStack Query** (React Query) - Server state management
- **Tailwind CSS 3** - Utility-first styling
- **React Hook Form** - Form validation
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Recharts** - Data visualization
- **FontAwesome** - Additional icons

### Backend (Server)

- **Node.js** - JavaScript runtime
- **Express 5** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose 8** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Validator** - Input validation
- **Express Rate Limit** - API rate limiting
- **Axios** - HTTP client for Ollama integration

### AI/ML

- **Ollama** - Local AI model runtime
- **Llama 3.2 1B** - Lightweight AI model (1.3GB)
- **Llama 3.2 3B** - Enhanced AI model (2.0GB)

### Unit Tests

- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **Vitest** - Vite-native test runner
- **React Testing Library** - React component testing

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

| Software    | Version                  | Required           | Download Link                                                          |
| ----------- | ------------------------ | ------------------ | ---------------------------------------------------------------------- |
| **Node.js** | v16+ (v18+ recommended)  | ✅ Yes             | [nodejs.org](https://nodejs.org/)                                      |
| **npm**     | v8+ (comes with Node.js) | ✅ Yes             | Included with Node.js                                                  |
| **MongoDB** | v5+                      | ✅ Yes             | [mongodb.com/download](https://www.mongodb.com/try/download/community) |
| **Ollama**  | Latest                   | ⚠️ For AI features | [ollama.com](https://ollama.com/download)                              |
| **Git**     | Latest                   | 📝 Recommended     | [git-scm.com](https://git-scm.com/)                                    |

### System Requirements

- **RAM**: 4GB minimum (8GB+ recommended for AI features)
- **Storage**: 5GB free space (for AI models)
- **OS**: macOS, Linux, or Windows 10/11

## 🚀 Quick Start

Get up and running in 5 minutes:

```bash
# 1. Clone the repository
git clone <repository-url>
cd money-manager

# 2. Run automated setup (macOS/Linux)
chmod +x setup-mac.sh
./setup-mac.sh

# OR for Windows (PowerShell as Administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
./setup-windows.ps1

# 3. Install dependencies
cd server && npm install
cd ../client && npm install

# 4. Set up environment variables (see below)
# Create server/.env and client/.env

# 5. Start MongoDB
mongod

# 6. Start the application
# Terminal 1: Start Ollama (for AI features)
ollama serve

# Terminal 2: Start backend
cd server && npm start

# Terminal 3: Start frontend
cd client && npm run dev

# 7. Open your browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:5001
```

## 📖 Detailed Setup Instructions

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd money-manager

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 3: Configure Environment Variables

#### Server Configuration (`server/.env`)

Create a file named `.env` in the `server` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=<replace-with-your-mongoDB-URI>

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# JWT Secret (change this to a random string)
JWT_SECRET=<replace-with-your-secret-token>

# Ollama Configuration (for AI chatbot)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b

# Email Configuration (optional, for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Client Configuration (`client/.env`)

Create a file named `.env` in the `client` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5001/api

# App Metadata
VITE_APP_NAME=Money Manager
VITE_APP_VERSION=1.0.0
```

### Step 4: Seed the Database (Optional)

Populate the database with sample data for testing:

```bash
cd server
node seed.js
```

This creates:

- Sample user accounts
- Example expenses and income
- Budget templates
- Debt records

---

## 🤖 AI Chatbot Setup

The AI chatbot is powered by **Ollama** running locally on your machine.

### Automated Setup

#### macOS/Linux

```bash
chmod +x setup-mac.sh
./setup-mac.sh
```

#### Windows (PowerShell as Administrator)

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
./setup-windows.ps1
```

The setup script will:

1. ✅ Install Ollama
2. ✅ Start the Ollama service
3. ✅ Download your chosen AI model(s)

### Manual Setup

#### Download AI Models

Choose one or both models based on your needs:

```bash
# Lightweight & Fast (1.3GB) - Recommended for most users
ollama pull llama3.2:1b

# Better Accuracy (2.0GB) - For more complex queries
ollama pull llama3.2:3b
```

### AI Model Comparison

| Model            | Size  | Speed        | Accuracy  | Use Case                          |
| ---------------- | ----- | ------------ | --------- | --------------------------------- |
| **Llama 3.2 1B** | 1.3GB | ⚡ Very Fast | ✓ Good    | Quick responses, basic queries    |
| **Llama 3.2 3B** | 2.0GB | ⚡ Fast      | ✓✓ Better | Complex analysis, detailed advice |

### Switching Models

You can switch models in two ways:

1. **In the UI**: Click the model dropdown in the chatbot header
2. **Via Environment**: Change `OLLAMA_MODEL` in `server/.env`

### Chatbot Features

#### Operating Modes

- **Basic Mode**: Rule-based responses for quick data queries
- **Advanced Mode**: AI-powered natural language understanding

Toggle modes using the power button in the chatbot header.

#### What the AI Can Do

- 💰 Check account balances and transactions
- 📊 Analyze spending patterns
- 💳 Review budget status
- 📈 Provide financial insights
- 🎯 Suggest expense reductions
- ❓ Answer questions like:
  - "How much did I spend on groceries this month?"
  - "Can I afford a $5000 car?"
  - "Where should I cut expenses?"
  - "What's my debt payoff timeline?"

---

## 🏃 Running the Application

### Development Mode

You need **3 terminal windows**:

#### Terminal 1: Start MongoDB

```bash
# macOS/Linux
mongod

# Windows (if not running as service)
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

#### Terminal 2: Start Ollama (for AI features)

```bash
ollama serve
```

#### Terminal 3: Start Backend Server

```bash
cd server
npm start
# OR for auto-reload during development
npm run dev
```

#### Terminal 4: Start Frontend

```bash
cd client
npm run dev
```

### Access Points

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001](http://localhost:5001)
- **Ollama API**: [http://localhost:11434](http://localhost:11434)

### Production Build

```bash
# Build frontend
cd client
npm run build

# The optimized files will be in client/dist/
# Serve with a static file server or configure your backend to serve them
```

---

## 📁 Project Structure

```
money-manager/
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ...
│   │   ├── contexts/            # React Context providers
│   │   │   ├── AuthContext.jsx  # Authentication state
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/               # Route-level pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Debts.jsx
│   │   │   ├── Accounts.jsx
│   │   │   └── Chatbot.jsx
│   │   ├── utils/               # Helper functions
│   │   │   ├── api.js           # Axios instance
│   │   │   └── format.js        # Formatting utilities
│   │   ├── tests/               # Frontend tests
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── .env                     # Client environment variables
│   ├── package.json             # Client dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS config
│   └── postcss.config.js        # PostCSS config
│
├── server/                      # Backend Node.js application
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Expense.js
│   │   ├── Income.js
│   │   ├── Budget.js
│   │   ├── Debt.js
│   │   ├── Account.js
│   │   └── ...
│   ├── routes/                  # Express routes
│   │   ├── auth.js              # Authentication routes
│   │   ├── expenses.js
│   │   ├── income.js
│   │   ├── budgets.js
│   │   ├── debts.js
│   │   ├── accounts.js
│   │   ├── chatbot.js           # AI chatbot routes
│   │   └── ...
│   ├── tests/                   # Backend tests
│   ├── utils/                   # Helper functions
│   ├── .env                     # Server environment variables
│   ├── index.js                 # Server entry point
│   ├── seed.js                  # Database seeding script
│   ├── package.json             # Server dependencies
│   └── jest.config.js           # Jest configuration
│
├── setup-mac.sh                 # Automated setup for macOS/Linux
├── setup-windows.ps1            # Automated setup for Windows
├── setup-windows.bat            # Batch wrapper for PowerShell
├── README.md                    # This file
└── .gitignore                   # Git ignore rules
```

---

## 📜 Available Scripts

### Server Scripts

```bash
cd server

# Start server in production mode
npm start

# Start server with auto-reload (development)
npm run dev

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Client Scripts

```bash
cd client

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm test
```

---

## 🔐 Environment Variables

### Server Environment Variables

| Variable         | Description               | Default                                     | Required    |
| ---------------- | ------------------------- | ------------------------------------------- | ----------- |
| `PORT`           | Server port               | `5001`                                      | ✅          |
| `NODE_ENV`       | Environment mode          | `development`                               | ✅          |
| `MONGODB_URI`    | MongoDB connection string | `mongodb://localhost:27017/expense-tracker` | ✅          |
| `CLIENT_URL`     | Frontend URL for CORS     | `http://localhost:5173`                     | ✅          |
| `JWT_SECRET`     | Secret key for JWT tokens | -                                           | ✅          |
| `OLLAMA_API_URL` | Ollama API endpoint       | `http://localhost:11434`                    | ⚠️ AI only  |
| `OLLAMA_MODEL`   | AI model to use           | `llama3.2:1b`                               | ⚠️ AI only  |
| `EMAIL_HOST`     | SMTP server               | -                                           | ❌ Optional |
| `EMAIL_PORT`     | SMTP port                 | `587`                                       | ❌ Optional |
| `EMAIL_USER`     | Email username            | -                                           | ❌ Optional |
| `EMAIL_PASS`     | Email password            | -                                           | ❌ Optional |

### Client Environment Variables

| Variable            | Description         | Default                     | Required |
| ------------------- | ------------------- | --------------------------- | -------- |
| `VITE_API_BASE_URL` | Backend API URL     | `http://localhost:5001/api` | ✅       |
| `VITE_APP_NAME`     | Application name    | `Money Manager`             | ❌       |
| `VITE_APP_VERSION`  | Application version | `1.0.0`                     | ❌       |

---

## 🧪 Testing

### Running Tests

#### Backend Tests

```bash
cd server
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

#### Frontend Tests

```bash
cd client
npm test                 # Run all tests
```

### Test Coverage

The application includes comprehensive tests for:

- ✅ Authentication (login, registration, JWT)
- ✅ Expense CRUD operations
- ✅ Budget management
- ✅ Debt tracking
- ✅ Account operations
- ✅ API endpoints
- ✅ Database models
- ✅ React components
- ✅ Form validation

---

## 👥 Authors

**Project Team**: Group 10  
**Course**: CompSci 520  
**Institution**: [Your University Name]

### Contributors

- **Person A**: Authentication & Core Infrastructure
- **Person B**: Dashboard & Analytics
- **Person C**: Account Management
- **Person D**: Transactions & Categories

---

## 📄 License

This project is developed as part of CompSci 520 coursework.

---

## 🙏 Acknowledgments

- **Ollama** for local AI model runtime
- **Meta** for Llama 3.2 models
- **MongoDB** for the database
- **React** and **Vite** communities

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Build Status**: ✅ Passing

---

## Quick Reference Card

```bash
# Start Everything (4 terminals)
Terminal 1: mongod
Terminal 2: ollama serve
Terminal 3: cd server && npm start
Terminal 4: cd client && npm run dev

# Access URLs
Frontend:    http://localhost:5173
Backend:     http://localhost:5001
Ollama:      http://localhost:11434

# Check Seed data for users details
```

Happy budgeting! 💰📊
