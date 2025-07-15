# Calorie Tracker Backend

A Node.js/Express backend service for calorie tracking using the USDA FoodData Central API with vendor abstraction, authentication, and caching.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **External API**: USDA FoodData Central API
- **Caching**: node-cache (in-memory)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- USDA API Key ([Get one here](https://fdc.nal.usda.gov/api-key-signup.html))

## Installation

1. **Clone the repository and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```


## Running the Application

### Development Mode
```bash
npm run dev
```


### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

#### Get Profile (Protected)
```http
GET /auth/profile
Authorization: Bearer your_jwt_token_here
```

### Calorie Tracking Endpoints

#### Get Calories (Main Endpoint)
```http
POST /api/get-calories

```



#### Search Food Items
```http
GET /api/search?query=pizza&pageSize=10&pageNumber=1
```

#### Get Food Details
```http
GET /api/food/:foodId
```

#### Batch Calorie Calculation
```http
POST /api/batch-calories

```

#### Get Service Status
```http
GET /api/status
```

#### Clear Cache (Protected)
```http
DELETE /api/cache?pattern=pizza
Authorization: Bearer your_jwt_token_here
```

## Testing


### Running Specific Tests
```bash
# Test food service
npm test -- --testPathPattern=foodService

# Test authentication
npm test -- --testPathPattern=auth

# Run with coverage
npm test -- --coverage
```


## Design Patterns & Architecture

### Vendor Abstraction
The system uses an abstract `FoodDataProvider` interface that allows easy switching between different food data vendors:

```javascript
// Current: USDA
const provider = new USDAProvider();

// Future: Easy to switch
const provider = new SpoonacularProvider();
const provider = new NutritionixProvider();
```

### OOP Principles
- **Encapsulation**: Services encapsulate business logic
- **Inheritance**: Providers extend abstract base class
- **Polymorphism**: Different providers implement same interface
- **Abstraction**: Clean separation between layers

### Error Handling
- Centralized error handling middleware
- User-friendly error messages
- Proper HTTP status codes
- Detailed logging for debugging

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (15 requests per 15 minutes)
- Input validation and sanitization
- Security headers with Helmet.js
- CORS configuration

## Performance Optimizations

- **Caching**: In-memory caching with configurable TTL
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: MongoDB connection pooling
- **Request Deduplication**: Cache prevents duplicate API calls

## Monitoring & Logging

- Request/response logging with timestamps
- Error logging with stack traces
- Performance metrics (response times)
- Health check endpoint for monitoring



### Environment Variables
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=super_secure_production_secret_at_least_32_chars
FRONTEND_URL=https://yourdomain.com
```