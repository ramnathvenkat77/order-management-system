# Checkout Sequence

This document shows the proposed checkout flow for the Order Management System.

The checkout process must re-check product availability, product status, current pricing, cart validity and coupon rules before creating the order.

## Checkout Sequence Diagram

```mermaid
sequenceDiagram

    actor Customer
    participant API
    participant Cart
    participant Product
    participant Coupon
    participant Database
    participant Order
    participant Payment

    Customer->>API: Submit checkout request

    API->>Cart: Get active cart
    Cart-->>API: Return cart and items

    API->>API: Validate cart is not empty

    API->>Product: Re-check products and current prices
    Product-->>API: Return product data

    API->>API: Validate products are active and purchasable

    opt Coupon provided
        API->>Coupon: Validate coupon
        Coupon-->>API: Return coupon result
    end

    API->>API: Calculate subtotal
    API->>API: Calculate discount
    API->>API: Calculate tax
    API->>API: Calculate shipping
    API->>API: Calculate grand total

    API->>Database: Begin transaction

    API->>Database: Re-check inventory

    alt Inventory available

        API->>Order: Create order
        Order-->>API: Order created

        API->>Database: Store order item snapshots

        API->>Database: Update or reserve inventory

        API->>Payment: Create payment attempt

        API->>Database: Commit transaction

        API-->>Customer: Return created order

    else Insufficient inventory

        API->>Database: Rollback transaction

        API-->>Customer: Return insufficient inventory error

    end