# Money Manager API Reference

This document describes the REST API for the Money Manager backend. All endpoints are prefixed with `/api`.

- Base URL (local): `http://localhost:5001/api`
- Authentication: Bearer JWT in `Authorization` header
- Content Type: `application/json`

## Authentication

### POST /auth/register
- Purpose: Create a new user account
- Auth: Public
- Body:
  - `name` string
  - `email` string
  - `password` string (min 8)
  - `currency` string (optional)
  - `timezone` string (optional)
- Responses:
  - 201 Created: `{ user: {...}, token: "..." }`
  - 400 Bad Request: Validation error

### POST /auth/login
- Purpose: Authenticate and receive JWT
- Auth: Public
- Body:
  - `email` string
  - `password` string
- Responses:
  - 200 OK: `{ user: {...}, token: "..." }`
  - 401 Unauthorized: Invalid credentials

### GET /auth/me
- Purpose: Get current user profile
- Auth: Bearer
- Responses:
  - 200 OK: `{ _id, name, email, currency, timezone, isEmailVerified }`
  - 401 Unauthorized

### PUT /auth/profile
- Purpose: Update current user profile
- Auth: Bearer
- Body: Any of `name`, `currency`, `timezone`
- Responses:
  - 200 OK: Updated profile
  - 400 Bad Request

## Accounts

### GET /accounts
- Purpose: List user accounts
- Auth: Bearer
- Query: none
- Responses: `[{ _id, name, type, balance, color, icon, description }]`

### POST /accounts
- Purpose: Create a new account
- Auth: Bearer
- Body:
  - `name` string
  - `type` enum: `checking|savings|credit|cash`
  - `balance` number
  - `color` string (hex)
  - `icon` string
  - `description` string (optional)
- Responses:
  - 201 Created: Account
  - 400 Bad Request

### GET /accounts/:id
- Purpose: Get a single account
- Auth: Bearer
- Responses:
  - 200 OK: Account
  - 404 Not Found

### PUT /accounts/:id
- Purpose: Update account details
- Auth: Bearer
- Body: `name`, `color`, `icon`, `description`
- Responses:
  - 200 OK: Account
  - 404 Not Found

### DELETE /accounts/:id
- Purpose: Delete an account
- Auth: Bearer
- Responses:
  - 204 No Content
  - 404 Not Found

## Categories

### Expense Categories

#### GET /expense-categories
- List all expense categories
- Auth: Bearer

#### POST /expense-categories
- Create expense category
- Body: `name`, `description`, `color`, `icon`, `budgetLimit`, `budgetPeriod`

#### PUT /expense-categories/:id
- Update category

#### DELETE /expense-categories/:id
- Delete category (blocked if associated expenses exist)

### Income Categories

#### GET /income-categories
- List all income categories
- Auth: Bearer

#### POST /income-categories
- Create income category
- Body: `name`, `description`, `color`, `icon`

#### PUT /income-categories/:id
- Update category

#### DELETE /income-categories/:id
- Delete category

---

## Expenses

### GET /expenses
- Purpose: List expenses with filtering
- Auth: Bearer
- Query:
  - `startDate` ISO date
  - `endDate` ISO date
  - `categoryId` string
  - `accountId` string
- Response: `[{ _id, amount, date, categoryId, accountId, tags, location, description }]`

### POST /expenses
- Purpose: Create new expense and update account balance
- Auth: Bearer
- Body:
  - `amount` number
  - `date` ISO date
  - `categoryId` string
  - `accountId` string
  - `paymentMethod` string
  - `location` string (optional)
  - `tags` array of string (optional)

### GET /expenses/:id
- Get expense by id

### PUT /expenses/:id
- Update expense (account balance adjusted accordingly)

### DELETE /expenses/:id
- Delete expense (account balance adjusted accordingly)

## Incomes

### GET /incomes
- Purpose: List incomes with filtering
- Auth: Bearer
- Query:
  - `startDate`, `endDate`, `categoryId`, `accountId`

### POST /incomes
- Purpose: Create new income and credit account balance
- Body:
  - `amount`, `date`, `categoryId`, `accountId`, `paymentMethod`, `source`

### GET /incomes/:id
- Get income by id

### PUT /incomes/:id
- Update income (account balance adjusted accordingly)

### DELETE /incomes/:id
- Delete income (account balance adjusted accordingly)

## Budgets

### GET /budgets
- Purpose: List budgets and utilization
- Auth: Bearer

### GET /budgets/:id
- Get budget by id

### POST /budgets
- Create budget for a category
- Body: `categoryId`, `amount`, `period`, `startDate`, `endDate`, `alertThreshold`

### PUT /budgets/:id
- Update budget

### DELETE /budgets/:id
- Delete budget

### GET /budgets/debug
- Diagnostic endpoint returning internal budget state (for troubleshooting)

## Debts

### GET /debts
- Purpose: List debts with status
- Auth: Bearer

### POST /debts
- Create a debt
- Body: `name`, `type`, `principal`, `currentBalance`, `interestRate`, `minimumPayment`, `dueDate`, `startDate`, `lender`, `accountNumber`

### GET /debts/:id
- Get debt by id

### PUT /debts/:id
- Update debt

### DELETE /debts/:id
- Delete debt

### POST /debts/:id/payment
- Record a payment
- Body: `amount`, `date`
- Validations: No overpayment; updates `currentBalance`, `totalPaid`, `lastPaymentDate`

### GET /debts/reminders/upcoming
- List upcoming debt payment reminders

### POST /debts/reminders/send
- Trigger sending due reminders (email scheduler)

### GET /debts/analytics/summary
- Summary analytics for debts (totals, progress)

## Notifications

### GET /notifications
- List notifications for current user

### POST /notifications
- Create notification

### PUT /notifications/:id/read
- Mark as read

### DELETE /notifications/:id
- Delete notification

### GET /notifications/unread-count
- Get number of unread notifications

### PUT /notifications/mark-all-read
- Mark all notifications as read

### DELETE /notifications
- Delete all notifications for current user

## Chatbot

### GET /chatbot/status
- Purpose: Check Ollama status and available model
- Auth: Bearer

### POST /chatbot/check-model
- Purpose: Check if a specific model is available
- Body: `model` string

### POST /chatbot/install-model
- Purpose: Install a specified Ollama model
- Body: `model` string

### POST /chatbot/toggle-ollama
- Purpose: Enable/disable Ollama integration flag
- Body: `enabled` boolean

### POST /chatbot/message
- Purpose: Send a chat message with optional financial context
- Auth: Bearer
- Body:
  - `message` string
  - `model` string (optional)
- Responses:
  - 200 OK: `{ reply: string, model: string }`
  - 400 Bad Request: Missing message
  - 503 Service Unavailable: Ollama offline (falls back to basic mode if implemented)

## Users

### GET /users/dashboard
- Purpose: Get dashboard aggregates for the current user
- Auth: Bearer

## Error Model
- Errors are returned as:
```json
{ "message": "Error description" }
```
- Common status codes: 400, 401, 403, 404, 409, 500

## Authentication Details
- Send Bearer token on all protected endpoints:
```
Authorization: Bearer <jwt>
```
- Obtain token via `/auth/login` or `/auth/register` response.

## Pagination and Filtering
- List endpoints may support filtering via query parameters as noted above.
- Pagination can be added with `page` and `limit` in future versions.


## Rate Limiting and Security
- Helmet is enabled for secure headers.
- CORS is configured for the client origin from `.env`.
- JWT is required for protected routes.

## Environment
- Required env values in `server/.env`:
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/expense-tracker
CLIENT_URL=http://localhost:5173
JWT_SECRET=<replace-with-secret>
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
```

## Test Coverage Summary
- Integration tests validate all major flows:
  - Auth, Expenses, Income, Budgets, Accounts, Debts, Chatbot
- Uses Jest, Supertest, and MongoDB Memory Server.