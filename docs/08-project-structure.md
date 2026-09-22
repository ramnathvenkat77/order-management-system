# Proposed Project Structure

This document describes the proposed folder and module structure for the Order Management System backend.

The structure is designed to keep routes, controllers, business logic, database logic, validation and shared utilities separate.

## Project Structure

```text
order-management-system/
│
├── docs/
│   ├── 01-requirements-and-assumptions.md
│   ├── 02-use-case-flow.md
│   ├── 03-er-diagram.md
│   ├── 04-api-contract.md
│   ├── 05-order-state-transition.md
│   ├── 06-checkout-sequence.md
│   ├── 07-auth-authorization-flow.md
│   └── 08-project-structure.md
│
├── src/
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── database.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── cart/
│   │   ├── addresses/
│   │   ├── coupons/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── notifications/
│   │   └── audit-logs/
│   │
│   ├── middleware/
│   │   ├── authentication.ts
│   │   ├── authorization.ts
│   │   ├── error-handler.ts
│   │   └── request-id.ts
│   │
│   ├── utils/
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── response.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│
├── migrations/
│
├── seeds/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Module Structure

Each major business module can contain files such as:

```text
products/
├── product.routes.ts
├── product.controller.ts
├── product.service.ts
├── product.repository.ts
├── product.validation.ts
└── product.types.ts
```

## Responsibility of Each Layer

### Routes

Routes define the API endpoint and connect the request to the correct controller.

Example:

POST `/api/v1/products`

### Controller

The controller handles the HTTP request and response.

It should not contain the main business logic.

### Service

The service contains the business rules.

Examples:

- Validate whether a product can be purchased
- Calculate coupon discount
- Process checkout
- Validate order status transitions

### Repository

The repository handles database operations.

Examples:

- Find a product
- Create an order
- Update inventory
- Load a customer's cart

### Validation

Validation checks incoming request data before it reaches the business logic.

Examples:

- Required fields
- Email format
- Positive quantity
- Valid product data

## Shared Middleware

### Authentication Middleware

Checks whether the request comes from an authenticated user.

### Authorization Middleware

Checks whether the authenticated user has permission to perform the action.

### Error Handler

Provides centralized error handling and consistent API error responses.

### Request ID Middleware

Creates or tracks a request ID so logs and responses can be traced.

## Why This Structure Is Proposed

This structure separates HTTP handling, business logic and database access.

It helps:

- Keep files focused
- Avoid putting business logic inside route handlers
- Reduce duplicated logic
- Improve testing
- Make modules easier to maintain
- Keep authentication and authorization reusable
- Handle errors consistently

## Important Design Rule

Business logic should mainly live inside the service layer instead of directly inside routes or controllers.

For example:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Database
```