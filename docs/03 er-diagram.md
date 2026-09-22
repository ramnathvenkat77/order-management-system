# ER Diagram

## Entities

The Order Management System contains the following main entities:

- User
- Category
- Product
- Address
- Cart
- CartItem
- Coupon
- Order
- OrderItem
- Payment
- AuditLog

## Entity Relationship Diagram

```mermaid
erDiagram

    USER ||--o{ ADDRESS : has
    USER ||--o| CART : owns
    USER ||--o{ ORDER : places
    USER ||--o{ AUDIT_LOG : performs

    CATEGORY ||--o{ PRODUCT : contains

    CART ||--o{ CART_ITEM : contains
    PRODUCT ||--o{ CART_ITEM : added_to

    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : referenced_by

    COUPON o|--o{ ORDER : applied_to

    ORDER ||--o{ PAYMENT : has

    ADDRESS ||--o{ ORDER : used_for

    USER {
        uuid id PK
        string name
        string email UK
        string password_hash
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CATEGORY {
        uuid id PK
        string name
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    PRODUCT {
        uuid id PK
        uuid category_id FK
        string sku UK
        string name
        string description
        decimal price
        int stock_quantity
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    ADDRESS {
        uuid id PK
        uuid user_id FK
        string address_line
        string city
        string state
        string postal_code
        string country
        boolean is_default
        datetime created_at
        datetime updated_at
    }

    CART {
        uuid id PK
        uuid user_id FK
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CART_ITEM {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        int quantity
        datetime created_at
        datetime updated_at
    }

    COUPON {
        uuid id PK
        string code UK
        string discount_type
        decimal discount_value
        decimal minimum_order_value
        decimal maximum_discount
        int usage_limit
        int usage_count
        datetime start_date
        datetime expiry_date
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    ORDER {
        uuid id PK
        uuid user_id FK
        uuid address_id FK
        uuid coupon_id FK
        string status
        decimal subtotal
        decimal discount
        decimal tax
        decimal shipping
        decimal grand_total
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        string product_name
        string sku
        decimal unit_price
        int quantity
        decimal line_total
    }

    PAYMENT {
        uuid id PK
        uuid order_id FK
        string status
        decimal amount
        string provider
        string provider_reference
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        string entity_id
        datetime created_at
    }