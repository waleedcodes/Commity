# 🏆 GitHub Analytics Tool (Commity)

A comprehensive platform for tracking, analyzing, and ranking GitHub contributors. This tool provides detailed insights into developer activity, repository statistics, and community engagement metrics.

![GitHub Analytics Tool](https://img.shields.io/badge/GitHub-Analytics-blue?style=for-the-badge&logo=github)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

## ✨ Features

### 🔍 **User Analytics**
- Comprehensive GitHub profile analysis
- Contribution history and patterns
- Repository statistics and insights
- Programming language distribution
- Activity timeline and trends

### 🏅 **Leaderboard System**
- Global and location-based rankings
- Multiple ranking categories (commits, repos, followers, etc.)
- Time-based leaderboards (daily, weekly, monthly, yearly)
- Language-specific leaderboards
- Custom filtering and sorting

### 📊 **Advanced Analytics**
- Contribution trends over time
- Repository performance metrics
- Developer activity patterns
- Collaboration network analysis
- Growth and engagement statistics

### 🚀 **Real-time Features**
- Live data synchronization with GitHub API
- Real-time leaderboard updates
- Instant profile refresh capabilities
- WebSocket-based notifications
- Caching for optimal performance

## 🏗️ Project Structure

```
github-analytics-tool/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database and API configurations
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication, validation, error handling
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic and GitHub API integration
│   │   ├── utils/          # Helper functions and utilities
│   │   └── index.js        # Application entry point
│   ├── tests/              # Backend tests
│   └── package.json
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client services
│   │   ├── utils/          # Frontend utilities
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── docs/                   # Documentation
├── docker-compose.yml      # Docker orchestration
├── README.md              # This file
└── package.json           # Root package configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **GitHub Personal Access Token**

### 1. Clone Repository

```bash
git clone https://github.com/waleedcodes/Commity.git
cd Commity
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Environment Setup

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit the environment file
nano backend/.env
```

**Required Environment Variables:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/github-analytics
GITHUB_TOKEN=your_github_personal_access_token_here
JWT_SECRET=your_secure_jwt_secret_here
FRONTEND_URL=http://localhost:3000
```

### 4. GitHub Token Setup

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Generate new token with scopes:
   - ✅ `read:user` (access user profile data)
   - ✅ `read:org` (access organization data)
   - ✅ `repo` (optional, for private repository data)
3. Add token to your `.env` file

### 5. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community  # macOS
# or follow MongoDB installation guide for your OS

# Start MongoDB
brew services start mongodb/brew/mongodb-community
```

**Option B: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 6. Run the Application

```bash
# Start backend server
npm run dev

# In another terminal, start frontend (when ready)
npm run dev:frontend
```

The API will be available at `http://localhost:3000/api`

## 🐳 Docker Setup

### Using Docker Compose

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Manual Docker Build

```bash
# Build backend
cd backend
docker build -t github-analytics-backend .

# Run with environment variables
docker run -p 3000:3000 --env-file .env github-analytics-backend
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
- **Public Endpoints**: No authentication required
- **Protected Endpoints**: Bearer token in Authorization header
- **Rate Limiting**: 100 requests/hour for public, 500+ for authenticated

### Core Endpoints

#### 👤 Users
```http
GET    /api/users                    # List all users
GET    /api/users/:username          # Get user profile
PUT    /api/users/:username          # Update user profile
GET    /api/users/:username/repos    # Get user repositories
GET    /api/users/:username/activity # Get user activity
POST   /api/users/:username/refresh  # Refresh user data
```

#### 🏆 Leaderboard
```http
GET    /api/leaderboard              # Global leaderboard
GET    /api/leaderboard/stats        # Leaderboard statistics
GET    /api/leaderboard/location/:location  # Location-based leaderboard
GET    /api/leaderboard/language/:language  # Language-based leaderboard
```

#### 📊 Analytics
```http
GET    /api/analytics                # Global analytics
GET    /api/analytics/user/:username # User-specific analytics
GET    /api/analytics/trends         # Contribution trends
GET    /api/analytics/compare        # Compare multiple users
```

#### 🔍 Search
```http
GET    /api/users/search?q=query     # Search users
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "hasNextPage": true
  },
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Invalid input parameters",
    "details": { ... }
  },
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend

# Run frontend tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Development Workflow

### Backend Development
```bash
cd backend

# Start development server with auto-reload
npm run dev

# Run linting
npm run lint

# Format code
npm run format

# Validate code quality
npm run validate
```

### Code Quality Standards

- **ESLint**: Airbnb JavaScript style guide
- **Prettier**: Consistent code formatting
- **Jest**: Unit and integration testing
- **Husky**: Pre-commit hooks for quality gates

## 📊 Architecture Overview

### Backend Architecture
- **Framework**: Express.js with middleware pipeline
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based stateless authentication
- **Caching**: In-memory caching with node-cache
- **API Integration**: GitHub REST API v4 and GraphQL v4

### Key Design Patterns
- **MVC Pattern**: Separation of concerns
- **Service Layer**: Business logic abstraction
- **Repository Pattern**: Data access abstraction
- **Middleware Pipeline**: Request/response processing
- **Error Handling**: Centralized error management

### Performance Optimizations
- **Caching Strategy**: Multi-level caching system
- **Rate Limiting**: API protection and quota management
- **Database Indexing**: Optimized query performance
- **Compression**: Gzip response compression
- **Connection Pooling**: Efficient database connections

## 🔒 Security Features

- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Mongoose ODM
- **XSS Protection**: Helmet security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Request throttling and abuse prevention
- **Authentication**: Secure JWT implementation
- **Error Handling**: Secure error message sanitization

## 🚀 Deployment

### Environment Setup

**Development**
```bash
NODE_ENV=development
```

**Production**
```bash
NODE_ENV=production
# Additional production configurations...
```

### Production Deployment Checklist

- [ ] Set production environment variables
- [ ] Configure production MongoDB URI
- [ ] Set secure JWT secrets
- [ ] Enable file logging
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL/TLS certificates
- [ ] Configure monitoring and alerting
- [ ] Set up backup strategies
- [ ] Configure CI/CD pipeline

### Monitoring and Logging

- **Winston**: Structured logging
- **Health Checks**: Application health monitoring
- **Error Tracking**: Comprehensive error reporting
- **Performance Metrics**: Response time and throughput monitoring

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow commit message conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GitHub API**: For providing comprehensive developer data
- **Open Source Community**: For the amazing tools and libraries
- **Contributors**: Everyone who helps improve this project

## 📞 Support

- 🐛 **Bug Reports**: [Create an issue](https://github.com/waleedcodes/Commity/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/waleedcodes/Commity/discussions)
- 📚 **Documentation**: Check the [docs](docs/) folder
- 💬 **Questions**: Use GitHub Discussions

## 🔮 Roadmap

### Phase 1: Core Features ✅
- [x] Backend API development
- [x] Database design and models
- [x] GitHub API integration
- [x] Basic authentication system

### Phase 2: Frontend Development 🚧
- [ ] React frontend implementation
- [ ] User dashboard and profiles
- [ ] Leaderboard visualization
- [ ] Analytics dashboard

### Phase 3: Advanced Features 📋
- [ ] Real-time updates with WebSockets
- [ ] Advanced analytics and insights
- [ ] Team and organization support
- [ ] Export and reporting features

### Phase 4: Enhancement 🔄
- [ ] Mobile application
- [ ] Advanced caching strategies
- [ ] Machine learning insights
- [ ] Community features

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [WaleedCodes](https://github.com/waleedcodes)

</div>
