# Testing Strategy

This document describes how the Order Management System backend will be tested.

The goal is to verify that the main business flows work correctly and that invalid, unauthorized and failure scenarios are handled safely.

## Types of Testing

### Unit Testing

Unit tests will test small pieces of business logic independently.

Examples:

- Coupon discount calculation
- Order total calculation
- Order status transition validation
- Quantity validation
- Product active/inactive validation

### Integration Testing

Integration tests will verify that different parts of the system work correctly together.

Examples:

- API with database
- Authentication with protected routes
- Cart with products
- Checkout with inventory
- Order creation with payment
- Transaction rollback behavior

### End-to-End Testing

End-to-end tests will simulate complete user flows.

Example:

```text
Register
  ↓
Login
  ↓
Browse Products
  ↓
Add Product to Cart
  ↓
Add Address
  ↓
Apply Coupon
  ↓
Checkout
  ↓
Payment
  ↓
View Order
```

## Authentication Tests

The system should test:

- Register a valid user
- Reject duplicate email registration
- Login with valid credentials
- Reject invalid password
- Reject access to protected APIs without authentication

## Authorization Tests

The system should test:

- Customer can access their own order
- Customer cannot access another customer's order
- Admin can create products
- Customer cannot create products
- Role restrictions are enforced correctly

## Product and Cart Tests

The system should test:

- Add valid product to cart
- Update cart quantity
- Remove cart item
- Reject invalid quantity
- Reject inactive product
- Reject invalid product
- Calculate cart totals correctly

## Coupon Tests

The system should test:

- Apply a valid coupon
- Reject invalid coupon
- Reject expired coupon
- Reject exhausted coupon
- Validate minimum order value
- Validate maximum discount
- Ensure discount does not make payable amount negative

## Checkout Tests

The system should test:

- Reject checkout with empty cart
- Reject checkout with insufficient stock
- Re-check product price during checkout
- Re-check product status during checkout
- Re-check coupon validity during checkout
- Calculate correct subtotal
- Calculate correct discount
- Calculate tax correctly
- Calculate shipping correctly
- Calculate correct grand total

## Payment Tests

The system should test:

- Successful payment
- Failed payment
- Successful payment moves order forward correctly
- Failed payment does not confirm the order
- Duplicate payment event does not create duplicate effects

## Order Status Tests

The system should test:

- Valid order status transitions
- Reject invalid status transitions

Example:

```text
CONFIRMED → PROCESSING
```

should be allowed.

But:

```text
PENDING_PAYMENT → DELIVERED
```

should be rejected.

## Concurrency Test

The system must test the critical limited-stock scenario.

Example:

```text
Product stock = 1
```

Customer A and Customer B both try to purchase the product at almost the same time.

Expected result:

```text
One checkout succeeds
One checkout fails because inventory is no longer available
```

Inventory must never become negative.

## Transaction Rollback Test

The system should test what happens when a checkout operation fails during a transaction.

Expected result:

- Order must not remain partially created
- Inventory must not remain incorrectly reduced
- Database state must remain consistent

## Negative Testing

The system should also test failure scenarios such as:

- Missing authentication
- Invalid credentials
- Unauthorized access
- Invalid product
- Invalid quantity
- Insufficient inventory
- Invalid coupon
- Expired coupon
- Invalid order status
- Payment failure
- Duplicate payment callback
- Database failure

## Test Organization

Tests can be organized like:

```text
tests/
├── unit/
│   ├── coupon.test.ts
│   ├── pricing.test.ts
│   └── order-status.test.ts
│
├── integration/
│   ├── auth.test.ts
│   ├── products.test.ts
│   ├── cart.test.ts
│   ├── checkout.test.ts
│   └── payments.test.ts
│
└── e2e/
    └── order-flow.test.ts
```

## Important Rules

- Critical business logic must be covered by automated tests.
- Happy paths and failure paths must both be tested.
- Authorization must be tested.
- Checkout concurrency must be tested.
- Transaction rollback must be tested.
- Duplicate payment events must not create duplicate effects.
- Tests should verify observable behavior and database state.