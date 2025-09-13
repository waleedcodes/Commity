# 🚀 Development Setup Guide

This guide will help you set up the GitHub Analytics Tool backend for development.

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **Git**
- **GitHub Account** with Personal Access Token

## ⚙️ Quick Setup

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/github-analytics

# GitHub API Configuration
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=30d

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL=300
CACHE_MAX_KEYS=1000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start MongoDB

```bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Run the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 🔑 GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select these scopes:
   - `public_repo` - Access public repositories
   - `read:user` - Read user profile information
   - `user:email` - Access user email addresses
   - `read:org` - Read organization membership
4. Copy the token to your `.env` file

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### User Endpoints
```bash
# Get all users
curl http://localhost:5000/api/users

# Get specific user
curl http://localhost:5000/api/users/octocat

# Search users
curl "http://localhost:5000/api/users/search?q=javascript"
```

### Leaderboard Endpoints
```bash
# Global leaderboard
curl http://localhost:5000/api/leaderboard

# Leaderboard stats
curl http://localhost:5000/api/leaderboard/stats

# Top contributors
curl http://localhost:5000/api/leaderboard/contributors
```

### Analytics Endpoints
```bash
# Global analytics
curl http://localhost:5000/api/analytics/global

# User analytics
curl http://localhost:5000/api/analytics/user/octocat

# Analytics trends
curl http://localhost:5000/api/analytics/trends
```

## 📊 Database Schema

### User Collection
```javascript
{
  username: "octocat",
  name: "The Octocat",
  avatarUrl: "https://github.com/images/error/octocat_happy.gif",
  bio: "GitHub mascot",
  location: "San Francisco",
  company: "GitHub",
  blog: "https://github.blog",
  email: "octocat@github.com",
  followers: 3000,
  following: 9,
  publicRepos: 8,
  totalRepos: 8,
  totalCommits: 1500,
  totalPullRequests: 100,
  totalIssues: 50,
  totalReviews: 200,
  totalContributions: 1850,
  currentStreak: 5,
  longestStreak: 30,
  topLanguages: [
    { name: "JavaScript", percentage: 45.2 },
    { name: "Python", percentage: 30.1 }
  ],
  recentRepos: [...],
  contributionCalendar: [...],
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-15T12:00:00.000Z",
  lastAnalyticsUpdate: "2024-01-15T12:00:00.000Z"
}
```

### Analytics Collection
```javascript
{
  username: "octocat",
  date: "2024-01-15T00:00:00.000Z",
  commits: 5,
  pullRequests: 2,
  issues: 1,
  reviews: 3,
  repositories: [...],
  languages: [...],
  additions: 150,
  deletions: 50
}
```

## 🛠️ Development Tools

### Available NPM Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run format         # Format code with Prettier
```

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- REST Client
- MongoDB for VS Code
- GitLens

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `PORT` | Server port | `5000` | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `GITHUB_TOKEN` | GitHub personal access token | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRE` | JWT expiration time | `30d` | No |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` | No |

## 🐛 Common Issues & Solutions

### MongoDB Connection Error
```bash
Error: MongoNetworkError: failed to connect to server
```
**Solution**: Make sure MongoDB is running:
```bash
brew services start mongodb-community
```

### GitHub API Rate Limit
```bash
Error: API rate limit exceeded
```
**Solution**: 
1. Check your token has sufficient rate limit
2. Implement caching for repeated requests
3. Use GraphQL for more efficient queries

### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**:
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### Missing Dependencies
```bash
Error: Cannot find module 'package-name'
```
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📈 Performance Tips

### Database Optimization
- Ensure indexes are created for frequently queried fields
- Use aggregation pipelines for complex queries
- Implement proper pagination for large datasets

### Caching Strategy
- Cache GitHub API responses
- Use Redis for production caching
- Implement cache invalidation strategies

### API Optimization
- Use field selection to reduce payload size
- Implement request compression
- Add proper rate limiting

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use different secrets for development and production
- Rotate secrets regularly

### API Security
- Validate all input data
- Implement proper authentication
- Use HTTPS in production
- Set up proper CORS policies

### Database Security
- Use MongoDB authentication
- Limit database user permissions
- Regular security updates

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📞 Support

If you need help:
1. Check this guide first
2. Search existing GitHub issues
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Logs (remove sensitive data)

---

Happy coding! 🚀
