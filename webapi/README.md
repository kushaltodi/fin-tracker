# FinTracker API

A comprehensive RESTful API for personal finance tracking built with Node.js, Express, and Knex.js.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication system
- 👤 **User Management** - User registration, login, and profile management
- 💳 **Account Management** - Multiple account types (checking, savings, credit, etc.)
- 📊 **Transaction Tracking** - Income, expense, and transfer transactions
- 🏷️ **Category Management** - Customizable income and expense categories
- 💰 **Budget Management** - Set and track budgets by category
- 📈 **Statistics & Analytics** - Comprehensive financial statistics
- 🔒 **Security** - Rate limiting, input validation, and security headers
- ✅ **Testing** - Jest test suite with comprehensive coverage

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with Knex.js ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Testing**: Jest, Supertest
- **Development**: Nodemon

## Project Structure

```
webapi/
├── src/
│   ├── database/
│   │   ├── migrations/          # Database migration files
│   │   ├── seeds/              # Database seed files
│   │   └── connection.js       # Database connection setup
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── notFound.js        # 404 handler
│   │   └── validation.js      # Input validation middleware
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User management routes
│   │   ├── accounts.js       # Account management routes
│   │   ├── transactions.js   # Transaction routes
│   │   ├── categories.js     # Category management routes
│   │   └── budgets.js        # Budget management routes
│   ├── utils/
│   │   ├── auth.js           # Authentication utilities
│   │   ├── dateHelpers.js    # Date manipulation utilities
│   │   └── numberHelpers.js  # Number formatting utilities
│   └── server.js             # Main application entry point
├── tests/                    # Test files
├── data/                     # SQLite database files
├── .env                      # Environment variables
├── .gitignore
├── knexfile.js              # Knex configuration
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd fin-tracker/webapi
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3001
   ```

4. **Run database migrations**

   ```bash
   npm run migrate
   ```

5. **Seed the database (optional)**

   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback last migration
- `npm run seed` - Run database seeds
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode

## API Documentation

### Authentication

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Protected Routes

All routes below require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### User Management

#### Get User Profile

```http
GET /api/users/profile
```

#### Update User Profile

```http
PUT /api/users/profile
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Get User Statistics

```http
GET /api/users/stats
```

### Account Management

#### Get All Accounts

```http
GET /api/accounts
```

#### Get Account by ID

```http
GET /api/accounts/:id
```

#### Create Account

```http
POST /api/accounts
Content-Type: application/json

{
  "name": "Main Checking",
  "type": "checking",
  "initialBalance": 1000.00,
  "currency": "USD"
}
```

#### Update Account

```http
PUT /api/accounts/:id
Content-Type: application/json

{
  "name": "Updated Account Name",
  "type": "savings",
  "currency": "USD"
}
```

#### Delete Account

```http
DELETE /api/accounts/:id
```

### Transaction Management

#### Get All Transactions

```http
GET /api/transactions?page=1&limit=50&accountId=1&type=expense
```

#### Get Transaction by ID

```http
GET /api/transactions/:id
```

#### Create Transaction

```http
POST /api/transactions
Content-Type: application/json

{
  "accountId": 1,
  "categoryId": 1,
  "amount": 50.00,
  "type": "expense",
  "description": "Grocery shopping",
  "date": "2023-11-02"
}
```

#### Update Transaction

```http
PUT /api/transactions/:id
Content-Type: application/json

{
  "accountId": 1,
  "categoryId": 1,
  "amount": 55.00,
  "type": "expense",
  "description": "Grocery shopping - updated",
  "date": "2023-11-02"
}
```

#### Delete Transaction

```http
DELETE /api/transactions/:id
```

### Category Management

#### Get All Categories

```http
GET /api/categories?type=expense
```

#### Create Category

```http
POST /api/categories
Content-Type: application/json

{
  "name": "Custom Category",
  "type": "expense",
  "color": "#ff5722",
  "icon": "custom-icon"
}
```

### Budget Management

#### Get All Budgets

```http
GET /api/budgets?period=monthly&isActive=true
```

#### Create Budget

```http
POST /api/budgets
Content-Type: application/json

{
  "categoryId": 1,
  "amount": 500.00,
  "period": "monthly",
  "startDate": "2023-11-01"
}
```

## Database Schema

### Users Table

- `id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `firstName`
- `lastName`
- `created_at`
- `updated_at`

### Accounts Table

- `id` (Primary Key)
- `userId` (Foreign Key)
- `name`
- `type` (checking, savings, credit, investment, cash)
- `balance`
- `initialBalance`
- `currency`
- `isActive`
- `created_at`
- `updated_at`

### Categories Table

- `id` (Primary Key)
- `userId` (Foreign Key)
- `name`
- `type` (income, expense)
- `color`
- `icon`
- `created_at`
- `updated_at`

### Transactions Table

- `id` (Primary Key)
- `userId` (Foreign Key)
- `accountId` (Foreign Key)
- `categoryId` (Foreign Key)
- `transferToAccountId` (Foreign Key, nullable)
- `amount`
- `type` (income, expense, transfer)
- `description`
- `date`
- `created_at`
- `updated_at`

### Budgets Table

- `id` (Primary Key)
- `userId` (Foreign Key)
- `categoryId` (Foreign Key)
- `amount`
- `period` (monthly, yearly)
- `startDate`
- `endDate` (nullable)
- `isActive`
- `created_at`
- `updated_at`

## Error Handling

The API uses consistent error response format:

```json
{
  "error": "Error message describing what went wrong",
  "stack": "Stack trace (only in development mode)"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (valid token but insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs with salt rounds
- **Rate Limiting** - Prevents abuse and DoS attacks
- **CORS Protection** - Configurable cross-origin requests
- **Helmet.js** - Sets security headers
- **Input Validation** - Comprehensive request validation
- **SQL Injection Prevention** - Parameterized queries with Knex.js

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The test suite includes:

- Unit tests for utilities
- Integration tests for API endpoints
- Database operation tests
- Authentication and authorization tests

## Deployment

### Environment Variables

Set the following environment variables in production:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-production-jwt-secret
DB_CONNECTION=./data/fin_tracker_prod.db
CORS_ORIGIN=https://your-frontend-domain.com
```

### Production Setup

1. Install dependencies: `npm ci --only=production`
2. Run migrations: `npm run migrate`
3. Start the server: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository.
