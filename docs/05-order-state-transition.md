# Order State Transition Diagram

The order lifecycle controls how an order moves from one status to another.

The client must not be allowed to move an order directly to any arbitrary status.

## Order Status Flow

```mermaid
stateDiagram-v2

    [*] --> PENDING_PAYMENT

    PENDING_PAYMENT --> CONFIRMED : Payment Successful
    PENDING_PAYMENT --> PAYMENT_FAILED : Payment Failed
    PENDING_PAYMENT --> CANCELLED : Order Cancelled

    PAYMENT_FAILED --> PENDING_PAYMENT : Retry Payment
    PAYMENT_FAILED --> CANCELLED : Cancel Order

    CONFIRMED --> PROCESSING : Start Processing
    CONFIRMED --> CANCELLED : Cancel Order

    PROCESSING --> SHIPPED : Ship Order
    PROCESSING --> CANCELLED : Cancel Order

    SHIPPED --> DELIVERED : Delivery Completed

    DELIVERED --> REFUNDED : Refund Approved

    CANCELLED --> REFUNDED : Payment Was Captured

    REFUNDED --> [*]
     ```