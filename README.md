# Money Manager - Smart Financial Management Tool

> A comprehensive expense tracking and financial management application with AI-powered chatbot assistance for students and early-career professionals.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Node](https://img.shields.io/badge/node-v16%2B-green)]()
[![React](https://img.shields.io/badge/react-18.2-blue)]()
[![Vite](https://img.shields.io/badge/vite-7.2-646CFF)]()
[![MongoDB](https://img.shields.io/badge/mongodb-5%2B-green)]()

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup Instructions](#detailed-setup-instructions)
- [AI Chatbot Setup](#ai-chatbot-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Authors](#authors)

## Overview

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

## Features

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

## Tech Stack

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

### Testing Frameworks

- **Jest 29** - Testing framework for backend
- **Supertest 7** - HTTP assertion library for API testing
- **MongoDB Memory Server 10** - In-memory database for integration tests
- **Vitest** - Vite-native test runner for frontend
- **React Testing Library** - React component testing
- **Playwright** - End-to-end testing

## Prerequisites

Before you begin, ensure you have the following installed:

| Software    | Version                  | Required           | 
| ----------- | ------------------------ | ------------------ | 
| **Node.js** | v16+ (v18+ recommended)  | Yes                | 
| **npm**     | v8+ (comes with Node.js) | Yes                | 
| **MongoDB** | v5+                      | Yes                | 
| **Ollama**  | Latest                   | For AI features    | 
| **Git**     | Latest                   | Recommended        |

### System Requirements

- **RAM**: 4GB minimum (8GB+ recommended for AI features)
- **Storage**: 5GB free space (for AI models)
- **OS**: macOS, Linux, or Windows 10/11

## Quick Start

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

## Detailed Setup Instructions

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

### Step 2: Configure Environment Variables

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

## AI Chatbot Setup

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

1. Install Ollama
2. Start the Ollama service
3. Download your chosen AI model(s)

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
| **Llama 3.2 1B** | 1.3GB | Very Fast | Good    | Quick responses, basic queries    |
| **Llama 3.2 3B** | 2.0GB | Fast      | Better | Complex analysis, detailed advice |

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

- Check account balances and transactions
- Analyze spending patterns
- Review budget status
- Provide financial insights
- Suggest expense reductions
- Answer questions like:
  - "How much did I spend on groceries this month?"
  - "Can I afford a $5000 car?"
  - "Where should I cut expenses?"
  - "What's my debt payoff timeline?"

## Running the Application

### Development Mode

You need **3 terminal windows**:

#### Terminal 1: Start MongoDB

```bash
# macOS/Linux
mongod

# Windows (if not running as a service)
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

## Project Structure

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
│   │   ├── inegration           # Integration tests
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

## Available Scripts

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


## Testing

The Money Manager application includes comprehensive testing at multiple levels to ensure reliability and correctness.

### Test Organization

```
server/tests/
├── integration/          # Integration tests (47 tests across 7 suites)
│   ├── auth-flow.integration.test.js
│   ├── expense-flow.integration.test.js
│   ├── income-flow.integration.test.js
│   ├── budget-flow.integration.test.js
│   ├── account-flow.integration.test.js
│   ├── debt-flow.integration.test.js
│   └── chatbot-flow.integration.test.js
├── accounts.test.js      # Unit tests
├── auth.test.js
├── budgets.test.js
├── expenses.test.js
├── incomes.test.js
└── ... (more unit tests)

client/src/tests/
├── pages/                # Component tests
│   ├── Dashboard.test.jsx
│   ├── Expenses.test.jsx
│   └── ...
└── App.test.jsx
```

### Running Tests

#### Backend Tests

```bash
cd server

# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run specific integration test suite
npm run test:integration -- auth-flow
npm run test:integration -- expense-flow
npm run test:integration -- income-flow
npm run test:integration -- budget-flow
npm run test:integration -- account-flow
npm run test:integration -- debt-flow
npm run test:integration -- chatbot-flow

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

#### Frontend Tests

```bash
cd client

# Run all tests
npm test

# Watch mode
npm run test:watch
```

### Integration Tests

Integration tests verify that multiple components work together correctly, testing complete user workflows from end to end.

**Test Suites:** 7 suites, 47 tests  
**Execution Time:** ~10 seconds  
**Pass Rate:** 100%

#### What Integration Tests Cover

**1. Authentication Flow (7 tests)**
- Complete registration -> login -> protected route access
- Duplicate user prevention
- Invalid credential rejection
- Token validation and expiration
- User profile management

**2. Expense Management (9 tests)**
- Category creation -> expense creation -> retrieval flow
- Multiple expenses across categories
- Expense updates and deletions
- Date range and category filtering
- Category deletion protection
- User data isolation

**3. Income Management (4 tests)**
- Income category and income creation flow
- Multiple income sources tracking
- Income updates with balance changes
- Income deletion and balance adjustment

**4. Budget Management (6 tests)**
- Budget creation and spending tracking
- Threshold alerts (80% warning)
- Budget exceeded scenarios
- Multiple budgets per category
- Budget CRUD operations

**5. Account Management (5 tests)**
- Multiple account creation and management
- Account updates and deletion
- Balance tracking with transactions
- User isolation

**6. Debt Management (8 tests)**
- Debt creation and tracking
- Payment processing
- Multiple payments and payoff tracking
- Payment validation (no overpayment)
- Debt CRUD operations

**7. Chatbot Integration (9 tests)**
- Ollama status and model availability
- Message handling with authentication
- Conversation history
- Financial context integration
- Error handling for missing parameters

#### Integration Test Features

- **Real Database**: Uses MongoDB Memory Server for isolated testing
- **Complete Workflows**: Tests full user journeys from start to finish
- **API Contract Testing**: Validates all API endpoints
- **Security Validation**: Tests authentication and authorization
- **User Isolation**: Verifies data separation between users
- **Sequential Execution**: Runs with `--runInBand` for consistency

### Unit Tests

Unit tests focus on individual components and functions in isolation.

**Coverage Areas:**
- Authentication logic (JWT, password hashing)
- Database models (validation, methods)
- API route handlers
- Middleware functions
- React components
- Form validation
- Utility functions

### Test Results

```bash
Test Suites: 7 passed, 7 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        ~10 seconds
```

All integration tests are passing with 100% success rate.

## Authors

**Project Team**: Group 10  
**Course**: CompSci 520  
**Institution**: University of Massachusetts - Amherst

## License

This project is developed as part of CompSci 520 coursework.

## Acknowledgments

- **Ollama** for local AI model runtime
- **Meta** for Llama 3.2 models
- **MongoDB** for the database
- **React** and **Vite** communities

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Build Status**: Passing


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

# Run Integration Tests
cd server && npm run test:integration

# Check Seed data for users details
```

Happy budgeting!
