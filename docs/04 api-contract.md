# API Contract

Base URL:

`/api/v1`

## 1. Authentication APIs

### Register Customer

**POST** `/api/v1/auth/register`

Request:

```json
{
  "name": "ramnath",
  "email": "ram@example.com",
  "password": "SecurePassword123"
}