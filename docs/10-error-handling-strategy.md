# Error Handling Strategy

This document describes how errors will be handled consistently across the Order Management System backend.

## Goals

The error handling strategy should:

- Return consistent error responses
- Avoid exposing sensitive internal information
- Use meaningful error codes
- Handle expected business errors separately from unexpected server errors
- Centralize error handling
- Include request IDs for tracing

## Standard Error Response

All errors should follow one consistent response format.

Example:

```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found"
  },
  "meta": {
    "requestId": "request-id"
  }
}
```

## Error Categories

### Validation Errors

These occur when request data is invalid.

Examples:

- Missing required field
- Invalid email
- Invalid quantity
- Invalid request format

Possible status code:

```text
400 Bad Request
```

### Authentication Errors

These occur when the user is not authenticated.

Examples:

- Missing authentication token
- Invalid token
- Expired token

Possible status code:

```text
401 Unauthorized
```

### Authorization Errors

These occur when the user is authenticated but does not have permission.

Examples:

- Customer tries to create a product
- Customer tries to access another customer's order
- Operations user tries to perform an Admin-only action

Possible status code:

```text
403 Forbidden
```

### Resource Not Found Errors

Examples:

- Product not found
- Order not found
- Address not found
- Coupon not found

Possible status code:

```text
404 Not Found
```

### Conflict Errors

Examples:

- Duplicate email
- Duplicate SKU
- Duplicate coupon code
- Insufficient inventory during concurrent checkout
- Duplicate payment event

Possible status code:

```text
409 Conflict
```

### Business Rule Errors

Examples:

- Inactive product
- Empty cart checkout
- Expired coupon
- Coupon usage limit exceeded
- Invalid order status transition
- Payment failure
- Insufficient inventory

These errors should return a clear business error code and message.

## Example Error Codes

```text
DUPLICATE_EMAIL
INVALID_CREDENTIALS
UNAUTHENTICATED
UNAUTHORIZED
PRODUCT_NOT_FOUND
PRODUCT_INACTIVE
INVALID_QUANTITY
INSUFFICIENT_INVENTORY
INVALID_COUPON
COUPON_EXPIRED
COUPON_USAGE_EXHAUSTED
EMPTY_CART
ORDER_NOT_FOUND
INVALID_ORDER_STATUS_TRANSITION
PAYMENT_FAILED
DUPLICATE_PAYMENT_EVENT
DATABASE_ERROR
INTERNAL_SERVER_ERROR
```

## Centralized Error Handling

Errors should not be handled differently in every controller.

A centralized error-handling middleware will be used.

Conceptual flow:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Error occurs
  ↓
Central Error Handler
  ↓
Consistent API Response
```

## Expected vs Unexpected Errors

### Expected Errors

These are known business or validation errors.

Examples:

```text
INVALID_QUANTITY
COUPON_EXPIRED
INSUFFICIENT_INVENTORY
```

These should return clear and safe messages.

### Unexpected Errors

Unexpected errors may include:

- Unhandled exceptions
- Unexpected database failures
- Internal application failures

The client should receive a generic response such as:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong"
  },
  "meta": {
    "requestId": "request-id"
  }
}
```

Internal technical details should be logged securely instead of being exposed to the client.

## Logging Rules

The system should log:

- Request ID
- Error code
- Endpoint
- Timestamp
- Relevant non-sensitive context

The system must not log:

- Passwords
- Authentication tokens
- Sensitive payment information
- Secret keys
- Database credentials

## Database and Transaction Errors

If a checkout transaction fails:

- The transaction must be rolled back
- Partial order state must not remain
- Inventory must remain consistent
- The client should receive a safe error response

## Important Rules

- Errors should be handled centrally.
- API error responses must be consistent.
- Sensitive internal details must not be exposed.
- Business errors should use meaningful error codes.
- Unexpected errors should return a safe generic message.
- Request IDs should be included for tracing.
- Sensitive credentials must never appear in normal logs.