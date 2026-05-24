# Backend Project Structure

## 📁 Project Organization

```
Backend/
├── src/
│   ├── config/
│   │   └── constants.js          # Configuration & constants
│   ├── controllers/
│   │   └── healthController.js   # Route handlers & business logic
│   ├── middleware/
│   │   └── security.js           # Security middlewares (Helmet, Rate-Limiting)
│   ├── routes/
│   │   └── index.js              # Route definitions
│   ├── utils/
│   │   └── logger.js             # Logging utility
│   └── index.js                  # Main application entry point
├── node_modules/
├── package.json
└── .gitignore
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev       # Run with hot-reload (nodemon)
```

### Production
```bash
npm start         # Run normally
```

## 📂 Folder Description

### `/src` - Source Code
Main application code organized by feature/concern.

### `/src/config`
- **constants.js**: Server, rate-limiting, and security configurations

### `/src/controllers`
- **healthController.js**: Handles route logic and responses
- Each controller contains action handlers for specific routes

### `/src/middleware`
- **security.js**: Security-related middleware
  - Helmet (HTTP header protection)
  - Rate limiters (general & strict)

### `/src/routes`
- **index.js**: Route definitions
- Maps HTTP methods to controllers

### `/src/utils`
- **logger.js**: Colored logging utility for development

## 🔒 Security Features

✓ **Helmet** - HTTP header protection  
✓ **Rate Limiting** - 100 req/15min (general), 5 req/15min (login)  
✓ **Express** - Modern web framework  

## 📝 Environment Variables

```env
PORT=3000
NODE_ENV=development
```

## 🛠️ Technologies

- **Express.js** - Web framework
- **Helmet** - Security middleware
- **express-rate-limit** - DDoS protection
- **Nodemon** - Development auto-reload
