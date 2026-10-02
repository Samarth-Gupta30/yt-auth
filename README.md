# MERN Stack Authentication & Authorization API

A robust, production-ready Node.js/Express backend providing secure JWT authentication and email verification via Nodemailer and Google OAuth2.

## 🚀 Live Demo
- **Live API Base URL:** `https://yt-auth-api.onrender.com`

## ✨ Features
- **User Authentication**: Secure signup and login with hashed passwords (`bcryptjs`).
- **JWT Authorization**: Token-based protection for private endpoints.
- **Email Verification**: Automated OTP / verification emails via Nodemailer with OAuth2.
- **Database Indexing**: MongoDB Atlas integration with TTL indices for session / token expiration.
- **Security & Best Practices**: Environment secret management, password salting, and CORS setup.

## 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ORM)
- **Authentication**: JSON Web Tokens (JWT), Bcrypt
- **Email Service**: Nodemailer (Google OAuth2)
- **Deployment**: Render (Backend), GitHub Actions / Git

## 📌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT |
| `POST` | `/api/auth/verify-email` | Verify email via OTP |

## 🚀 Local Setup

1. Clone repository:
   ```bash
   git clone [https://github.com/Samarth-Gupta30/yt-auth.git](https://github.com/Samarth-Gupta30/yt-auth.git)
   cd yt-auth