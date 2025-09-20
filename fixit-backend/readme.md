# Fixit AI Backend

A fully functional backend for an AI-powered chat application using Google's Gemini API, built with Node.js, Express, and MySQL.

## Features

- 🤖 AI-powered chat using Google Gemini API
- 👥 User authentication and authorization
- 💬 Chat session management with conversation history
- 📧 Email notifications
- 📁 File upload capabilities
- 🔒 Security middleware and rate limiting
- 📊 Comprehensive logging
- 🗄️ MySQL database with Sequelize ORM

## Prerequisites

- Node.js (v16 or higher)
- XAMPP (for MySQL database)
- Gmail account (for email notifications)
- Google Gemini API key

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd fixit-backend
   npm install
   ```

2. **Setup database:**
   - Start XAMPP
   - Create database named `fixit_chat`

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Add your Gemini API key
   - Configure email settings

4. **Initialize database:**
   ```bash
   npm run migrate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Chat
- `GET /api/chat/sessions` - Get chat sessions
- `POST /api/chat/sessions` - Create new session
- `GET /api/chat/sessions/:id` - Get session with messages
- `PUT /api/chat/sessions/:id` - Update session
- `DELETE /api/chat/sessions/:id` - Delete session
- `POST /api/chat/messages` - Send message

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read

### Upload
- `POST /api/upload/file` - Upload file
- `POST /api/upload/avatar` - Upload avatar
- `DELETE /api/upload/:filename` - Delete file

## Project Structure

```
fixit-backend/
├── config/
│   ├── database.js
│   └── cors.js
├── controllers/
│   ├── authController.js
│   └── chatController.js
├── middleware/
│   ├── auth.js
│   ├── validation.js
│   ├── rateLimiter.js
│   └── errorHandler.js
├── models/
│   ├── index.js
│   ├── User.js
│   ├── ChatSession.js
│   ├── Message.js
│   ├── UserSettings.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── notificationRoutes.js
│   └── uploadRoutes.js
├── services/
│   ├── geminiService.js
│   ├── emailService.js
│   └── notificationService.js
├── utils/
│   ├── logger.js
│   ├── tokenUtils.js
│   └── helpers.js
├── scripts/
│   ├── migrate.js
│   ├── setup.js
│   └── install.js
├── server.js
├── package.json
└── .env
```

## Environment Variables

See `.env.example` for all required environment variables.

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run migrate` - Run database migrations
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License