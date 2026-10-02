# YT-Auth - Authentication System

A robust authentication and authorization system built with Node.js, Express, and MongoDB. This project implements user registration, OTP-based email verification, JWT-based token management, and session handling with refresh token rotation.

## Features

- **User Registration**: Create new user accounts with username, email, and password
- **Email Verification**: OTP-based email verification using Gmail SMTP with OAuth2
- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **Session Management**: Track user sessions and manage multiple device logins
- **Token Refresh**: Automatic token refresh with refresh token rotation
- **Logout Functionality**: Single device logout and logout from all devices
- **Secure Password Storage**: SHA-256 hashing for password security
- **User Profile**: Get current user information via JWT token

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Database**: MongoDB (Mongoose v9.9.0)
- **Authentication**: JSON Web Tokens (JWT)
- **Email Service**: Nodemailer with Gmail OAuth2
- **Logging**: Morgan HTTP request logger
- **Cookie Management**: Cookie-Parser
- **Environment**: Dotenv for configuration management

## Project Structure

```
yt-auth/
├── server.js                    # Entry point - Server initialization
├── package.json                 # Project dependencies
├── .env                         # Environment variables (not included)
└── src/
    ├── app.js                   # Express app configuration
    ├── config/
    │   ├── config.js            # Configuration loader from environment variables
    │   └── database.js          # MongoDB connection setup
    ├── controllers/
    │   └── auth.controller.js   # Authentication business logic
    ├── models/
    │   ├── user.model.js        # User schema and model
    │   ├── otp.model.js         # OTP verification schema
    │   └── session.model.js     # Session management schema
    ├── routes/
    │   └── auth.routes.js       # API route definitions
    ├── services/
    │   └── email.service.js     # Email sending service
    └── utils/
        └── utils.js             # Utility functions (OTP generation, etc.)
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Gmail account with OAuth2 credentials

### Steps

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd yt-auth
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   Create a `.env` file in the root directory and add the following:

   ```env
   # MongoDB Configuration
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/yt-auth

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_change_this

   # Gmail OAuth2 Configuration
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REFRESH_TOKEN=your_google_refresh_token
   GOOGLE_USER=your_email@gmail.com
   ```

4. **Setup Gmail OAuth2 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Gmail API
   - Create OAuth2 credentials (Desktop application)
   - Generate refresh token using [Google OAuth2 Playground](https://developers.google.com/oauthplayground)

## Running the Project

### Development Mode

```bash
npm run dev
```

This will start the server with Nodemon for automatic restart on file changes.

### Server

- The server runs on `http://localhost:3000`
- HTTP logs are displayed via Morgan logger

## API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. Register User

- **Endpoint**: `POST /api/auth/register`
- **Description**: Create a new user account
- **Request Body**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "username": "john_doe",
      "email": "john@example.com",
      "id": "user_id",
      "verified": false
    }
  }
  ```

#### 2. Login User

- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate user and receive tokens
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (200):
  - **Header**: Sets HTTP-only cookie with refresh token
  - **Body**: Contains access token for further API calls

#### 3. Get Current User

- **Endpoint**: `GET /api/auth/get-me`
- **Description**: Retrieve current authenticated user information
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (200):
  ```json
  {
    "message": "User found",
    "user": {
      "username": "john_doe",
      "email": "john@example.com",
      "id": "user_id"
    }
  }
  ```

#### 4. Refresh Token

- **Endpoint**: `GET /api/auth/refresh-token`
- **Description**: Get a new access token using refresh token
- **Cookies**: Must include `refreshtoken` cookie
- **Response** (200): New access token

#### 5. Logout (Single Device)

- **Endpoint**: `GET /api/auth/logout`
- **Description**: Revoke refresh token for current device
- **Cookies**: Must include `refreshtoken` cookie
- **Response** (200): Logout success message

#### 6. Logout All Devices

- **Endpoint**: `GET /api/auth/logout-all`
- **Description**: Revoke all refresh tokens and sessions
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (200): Logout success message

## Workflow

### User Registration and Email Verification Workflow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ POST /register
       ▼
┌─────────────────────┐
│ Check if user exists│ (Check by username/email)
└──────┬──────────────┘
       │
       ├─ User exists → 409 Conflict
       │
       └─ User not found
          │
          ▼
      ┌──────────────────┐
      │ Hash Password    │ (SHA-256)
      │ Create User      │
      │ Generate OTP     │
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │ Store OTP Hash   │ (In database)
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │ Send Email       │ (Via Gmail OAuth2)
      │ with Verify Link │ (Contains JWT token)
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │ Return 201       │
      │ Success Response │
      └──────────────────┘
```

### Login and Token Generation Workflow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ POST /login
       │ (email, password)
       ▼
┌─────────────────────────┐
│ Find user by email      │
└──────┬──────────────────┘
       │
       ├─ User not found → 404 Not Found
       │
       └─ User found
          │
          ▼
      ┌──────────────────┐
      │ Hash password    │
      │ Compare with DB  │
      └────────┬─────────┘
               │
               ├─ Password mismatch → 401 Unauthorized
               │
               └─ Password matches
                  │
                  ▼
          ┌──────────────────────┐
          │ Generate Access Token│ (JWT)
          │ Generate Refresh     │
          │ Token                │
          └────────┬─────────────┘
                   │
                   ▼
          ┌──────────────────────┐
          │ Hash Refresh Token   │
          │ Create Session       │
          └────────┬─────────────┘
                   │
                   ▼
          ┌──────────────────────┐
          │ Set HTTP-only Cookie │
          │ Return Access Token  │
          │ 200 OK               │
          └──────────────────────┘
```

### Token Refresh Workflow

```
┌─────────────────────┐
│ Client Request      │
│ GET /refresh-token  │
└──────┬──────────────┘
       │ (with refreshtoken cookie)
       ▼
┌──────────────────────┐
│ Extract Refresh Token│
│ from Cookie          │
└──────┬───────────────┘
       │
       ├─ Token not found → 401
       │
       └─ Token found
          │
          ▼
      ┌──────────────────┐
      │ Verify JWT       │
      └────────┬─────────┘
               │
               ├─ Invalid token → 401
               │
               └─ Valid token
                  │
                  ▼
          ┌──────────────────────┐
          │ Hash refresh token   │
          │ Find session by hash │
          └────────┬─────────────┘
                   │
                   ├─ Session not found or revoked → 401
                   │
                   └─ Valid session found
                      │
                      ▼
              ┌──────────────────────┐
              │ Generate new access  │
              │ token                │
              │ Optionally rotate    │
              │ refresh token        │
              └────────┬─────────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │ Return new access    │
              │ token                │
              │ 200 OK               │
              └──────────────────────┘
```

### Logout Workflow

```
┌─────────────────────┐
│ Client Request      │
│ GET /logout         │
└──────┬──────────────┘
       │ (with refreshtoken cookie)
       ▼
┌──────────────────────┐
│ Extract Refresh Token│
│ from Cookie          │
└──────┬───────────────┘
       │
       ├─ Token not found → 401
       │
       └─ Token found
          │
          ▼
      ┌──────────────────┐
      │ Hash refresh token│
      │ Find Session     │
      └────────┬─────────┘
               │
               ├─ Session not found → 401
               │
               └─ Session found
                  │
                  ▼
          ┌──────────────────────┐
          │ Mark session as      │
          │ revoked              │
          │ (Set revoked = true) │
          └────────┬─────────────┘
                   │
                   ▼
          ┌──────────────────────┐
          │ Clear refresh token  │
          │ cookie               │
          │ Return 200 OK        │
          └──────────────────────┘
```

### Get User (Protected Route) Workflow

```
┌─────────────────────┐
│ Client Request      │
│ GET /get-me         │
└──────┬──────────────┘
       │ Headers: Authorization: Bearer <token>
       ▼
┌──────────────────────┐
│ Extract Access Token │
│ from Authorization   │
│ header               │
└──────┬───────────────┘
       │
       ├─ Token not found → 401
       │
       └─ Token found
          │
          ▼
      ┌──────────────────┐
      │ Verify JWT token │
      │ using JWT_SECRET │
      └────────┬─────────┘
               │
               ├─ Invalid/expired token → 401
               │
               └─ Valid token
                  │
                  ▼
          ┌──────────────────────┐
          │ Extract user ID from │
          │ decoded token        │
          │ Find user by ID      │
          └────────┬─────────────┘
                   │
                   ├─ User not found → 404
                   │
                   └─ User found
                      │
                      ▼
              ┌──────────────────────┐
              │ Return user info     │
              │ 200 OK               │
              └──────────────────────┘
```

## Security Features

- **Password Hashing**: SHA-256 hashing for user passwords
- **JWT Tokens**: Secure, time-limited access tokens
- **Refresh Token Rotation**: Token rotation on refresh for enhanced security
- **HTTP-only Cookies**: Refresh tokens stored in secure, HTTP-only cookies
- **Email Verification**: OTP-based email verification before account activation
- **Session Revocation**: Ability to revoke sessions and logout from all devices
- **Environment Variables**: Sensitive data stored in environment variables

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `401 Unauthorized`: Missing or invalid token/credentials
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (duplicate user)

## Dependencies Overview

| Package       | Version | Purpose               |
| ------------- | ------- | --------------------- |
| express       | ^5.2.1  | Web framework         |
| mongoose      | ^9.9.0  | MongoDB ODM           |
| jsonwebtoken  | ^9.0.3  | JWT handling          |
| nodemailer    | ^9.0.3  | Email service         |
| dotenv        | ^17.4.2 | Environment variables |
| morgan        | ^1.11.0 | HTTP logging          |
| cookie-parser | ^1.4.7  | Cookie parsing        |

## Development Scripts

- `npm run dev`: Start development server with Nodemon (auto-restart on changes)
- `npm test`: Run tests (currently not configured)

## Future Enhancements

- [ ] Add email verification endpoint to complete email verification
- [ ] Implement password reset functionality
- [ ] Add user profile update endpoint
- [ ] Implement rate limiting for login attempts
- [ ] Add two-factor authentication (2FA)
- [ ] Create comprehensive test suite
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement role-based access control (RBAC)
- [ ] Add database migrations
- [ ] Implement audit logging

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

