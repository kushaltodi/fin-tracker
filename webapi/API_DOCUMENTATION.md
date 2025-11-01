# FinTracker API Documentation

A comprehensive financial tracking API built with Node.js, Express, and Knex.js with SQLite database.

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Accounts](#accounts)
- [Categories](#categories)
- [Transactions](#transactions)
- [Portfolio](#portfolio)
- [Dashboard](#dashboard)
- [Error Handling](#error-handling)

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Register

- **POST** `/auth/register`
- **Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

- **Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "jwt-token-here"
}
```

### Login

- **POST** `/auth/login`
- **Body:**

```json
{
  "login": "john_doe", // username or email
  "password": "securePassword123"
}
```

- **Response:**

```json
{
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "jwt-token-here"
}
```

## Users

### Get Profile

- **GET** `/users/profile` 🔒
- **Response:**

```json
{
  "user_id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Update Profile

- **PUT** `/users/profile` 🔒
- **Body:**

```json
{
  "username": "new_username",
  "email": "new@example.com"
}
```

### Get User Statistics

- **GET** `/users/stats` 🔒
- **Response:**

```json
{
  "accounts_count": 5,
  "transactions_count": 150,
  "categories_count": 12,
  "total_income": 5000.0,
  "total_expense": 3500.0,
  "net_worth": 15000.0
}
```

## Accounts

### Get All Accounts

- **GET** `/accounts` 🔒
- **Response:**

```json
[
  {
    "account_id": 1,
    "account_name": "Checking Account",
    "account_type": "Checking",
    "initial_balance": 1000.0,
    "current_balance": 1250.5,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Account by ID

- **GET** `/accounts/:id` 🔒
- **Response:** Single account object with current balance

### Create Account

- **POST** `/accounts` 🔒
- **Body:**

```json
{
  "account_name": "Savings Account",
  "account_type": "Savings",
  "initial_balance": 5000.0
}
```

### Update Account

- **PUT** `/accounts/:id` 🔒
- **Body:**

```json
{
  "account_name": "Updated Account Name",
  "account_type": "Investment"
}
```

### Delete Account (Soft Delete)

- **DELETE** `/accounts/:id` 🔒

### Get Deleted Accounts

- **GET** `/accounts/trash` 🔒

### Restore Deleted Account

- **POST** `/accounts/:id/restore` 🔒

### Permanently Delete Account

- **DELETE** `/accounts/:id/permanent` 🔒

## Categories

### Get All Categories

- **GET** `/categories` 🔒
- **Response:**

```json
[
  {
    "category_id": 1,
    "category_name": "Groceries",
    "category_type": "Expense",
    "description": "Food and grocery expenses",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Category

- **POST** `/categories` 🔒
- **Body:**

```json
{
  "category_name": "Entertainment",
  "category_type": "Expense",
  "description": "Movies, games, and fun activities"
}
```

### Update Category

- **PUT** `/categories/:id` 🔒

### Delete Category (Soft Delete)

- **DELETE** `/categories/:id` 🔒

### Get Category Statistics

- **GET** `/categories/:id/stats` 🔒
- **Response:**

```json
{
  "category_id": 1,
  "category_name": "Groceries",
  "total_spent": 850.0,
  "transaction_count": 25,
  "average_amount": 34.0,
  "last_transaction_date": "2024-01-15"
}
```

## Transactions

### Get All Transactions

- **GET** `/transactions` 🔒
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 20)
  - `account_id`
  - `category_id`
  - `transaction_type` (INCOME/EXPENSE)
  - `start_date` (YYYY-MM-DD)
  - `end_date` (YYYY-MM-DD)

### Create Single Transaction

- **POST** `/transactions` 🔒
- **Body:**

```json
{
  "account_id": 1,
  "category_id": 2,
  "amount": 50.0,
  "transaction_type": "EXPENSE",
  "description": "Grocery shopping",
  "transaction_date": "2024-01-15"
}
```

### Create Transfer Between Accounts

- **POST** `/transactions/transfer` 🔒
- **Body:**

```json
{
  "from_account_id": 1,
  "to_account_id": 2,
  "amount": 500.0,
  "description": "Transfer to savings"
}
```

### Update Transaction

- **PUT** `/transactions/:id` 🔒

### Delete Transaction (Soft Delete)

- **DELETE** `/transactions/:id` 🔒

### Get Transfer Groups

- **GET** `/transactions/transfers` 🔒

## Portfolio

### Get All Stock Trades

- **GET** `/portfolio/trades` 🔒
- **Query Parameters:**
  - `ticker_symbol`
  - `trade_type` (BUY/SELL)
  - `start_date`
  - `end_date`

### Create Stock Trade

- **POST** `/portfolio/trades` 🔒
- **Body:**

```json
{
  "security_id": 1,
  "account_id": 2,
  "trade_type": "BUY",
  "quantity": 10,
  "price_per_share": 150.0,
  "trade_date": "2024-01-15",
  "fees": 9.99
}
```

### Get Portfolio Holdings

- **GET** `/portfolio/holdings` 🔒
- **Response:**

```json
[
  {
    "ticker_symbol": "AAPL",
    "company_name": "Apple Inc.",
    "total_quantity": 50,
    "average_cost": 145.5,
    "total_invested": 7275.0,
    "current_value": 8000.0,
    "unrealized_pl": 725.0,
    "unrealized_pl_percent": 9.97
  }
]
```

### Get Securities

- **GET** `/portfolio/securities` 🔒

### Create Security

- **POST** `/portfolio/securities` 🔒
- **Body:**

```json
{
  "ticker_symbol": "AAPL",
  "company_name": "Apple Inc.",
  "sector": "Technology"
}
```

## Dashboard

### Get Dashboard Summary

- **GET** `/dashboard/summary` 🔒
- **Response:**

```json
{
  "net_worth": 25000.00,
  "total_cash": 15000.00,
  "total_investments": 12000.00,
  "total_liabilities": 2000.00,
  "account_balances": [...],
  "investment_summary": {
    "total_value": 12000.00,
    "total_invested": 11000.00,
    "total_unrealized_pl": 1000.00,
    "holdings_count": 5
  },
  "recent_transactions": [...],
  "monthly_trends": [...],
  "top_categories": [...]
}
```

## Error Handling

All endpoints return consistent error responses:

### Validation Error (400)

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": ["Username is required", "Email must be valid"]
}
```

### Authentication Error (401)

```json
{
  "error": "Authentication Error",
  "message": "Invalid or expired token"
}
```

### Not Found Error (404)

```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### Server Error (500)

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API is rate limited to 100 requests per 15 minutes per IP address.

## Database Schema

The API uses the following main tables:

- `users` - User accounts and authentication
- `accounts` - Financial accounts (checking, savings, investment, etc.)
- `categories` - Income and expense categories
- `transactions` - Financial transactions and transfers
- `securities` - Stock/investment securities
- `stock_trades` - Buy/sell transactions for investments

All tables support soft deletion with `deleted_at` timestamp fields.

## Getting Started

1. Install dependencies: `npm install`
2. Run migrations: `npm run migrate`
3. Start server: `npm start`
4. Access health check: `GET /health`

The API is now ready to handle financial tracking operations!
