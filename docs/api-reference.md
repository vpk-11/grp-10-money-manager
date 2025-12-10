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

---

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

---

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

---

