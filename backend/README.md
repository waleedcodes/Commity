# GitHub Analytics Tool - Backend

This is the backend API for the GitHub Analytics Tool, a comprehensive platform for tracking and ranking GitHub contributors.

## 🚀 Features

- **User Profile Management**: Fetch and cache GitHub user profiles
- **Repository Analytics**: Analyze user repositories and contributions
- **Leaderboard System**: Rank users by various metrics
- **Real-time Data**: Integration with GitHub API for live data
- **Caching Layer**: Efficient caching for better performance
- **Rate Limiting**: Built-in rate limiting and API protection
- **Comprehensive Analytics**: Detailed insights and trends

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── index.js        # Main application entry
├── tests/              # Test files
├── .env.example        # Environment variables template
└── package.json        # Dependencies and scripts
```

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- GitHub Personal Access Token

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd github-analytics-tool/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/github-analytics
   GITHUB_TOKEN=your_github_token_here
   JWT_SECRET=your_jwt_secret_here
   ```

4. **GitHub Token Setup**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with scopes: `read:user`, `read:org`, `repo` (optional)
   - Add the token to your `.env` file

5. **Database Setup**
   - Start MongoDB locally or use MongoDB Atlas
   - The application will create the database and collections automatically

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Code Formatting
```bash
npm run format
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Main Endpoints

#### Users
- `GET /users` - Get all users with pagination
- `GET /users/:username` - Get user profile
- `PUT /users/:username` - Update user profile
- `GET /users/:username/repositories` - Get user repositories
- `GET /users/:username/activity` - Get user activity
- `POST /users/:username/refresh` - Refresh user data

#### Leaderboard
- `GET /leaderboard` - Get global leaderboard
- `GET /leaderboard/location/:location` - Get leaderboard by location
- `GET /leaderboard/language/:language` - Get leaderboard by language
- `GET /leaderboard/user/:username` - Get user ranking

#### Analytics
- `GET /analytics` - Get global analytics
- `GET /analytics/user/:username` - Get user analytics
- `GET /analytics/trends/contributions` - Get contribution trends
- `GET /analytics/trends/languages` - Get language trends

### Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... },
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2023-12-01T10:00:00.000Z",
  "path": "/api/users/invalid",
  "method": "GET"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/github-analytics` |
| `GITHUB_TOKEN` | GitHub Personal Access Token | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |

### Database Configuration

The application uses MongoDB with Mongoose ODM. Key collections:

- **users**: User profiles and GitHub data
- **analytics**: User analytics and metrics
- **cache**: Application cache data

### Caching Strategy

- User profiles: 5 minutes
- Repositories: 10 minutes
- Events/Activity: 2 minutes
- Leaderboards: 15 minutes
- Analytics: 30 minutes

## 🔒 Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Joi schema validation
- **Error Handling**: Secure error responses
- **Authentication**: JWT-based authentication

## 📊 Monitoring

### Health Check
```
GET /health
```

Returns server status and basic metrics.

### Logs

Logs are managed by Winston:
- Console output (development)
- File logging (production)
- Error tracking and reporting

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t github-analytics-backend .

# Run container
docker run -p 3000:3000 github-analytics-backend
```

### Environment-specific Deployment

**Production Checklist:**
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set secure JWT secret
- [ ] Enable file logging
- [ ] Configure monitoring
- [ ] Set up reverse proxy (nginx)
- [ ] Enable SSL/TLS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📝 API Rate Limits

- Public endpoints: 100 requests/hour per IP
- Authenticated users: 500 requests/hour
- Premium users: 1000 requests/hour
- Admin users: Unlimited

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB is running
   - Verify connection string in `.env`

2. **GitHub API Rate Limit**
   - Check your GitHub token
   - Implement request caching
   - Use authenticated requests

3. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill existing processes: `lsof -ti:3000 | xargs kill`

### Debug Mode
```bash
DEBUG=github-analytics:* npm run dev
```

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

- Create an issue for bugs
- Start a discussion for questions
- Check the wiki for additional documentation
