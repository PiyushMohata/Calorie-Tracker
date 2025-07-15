# Calorie Tracker Frontend

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS3 with CSS Variables and Flexbox/Grid
- **Notifications**: React Toastify
- **Authentication**: JWT stored in localStorage
- **Testing**: React Testing Library + Jest

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Backend API running on port 5000

## Installation

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

### Development
```bash
npm start
```
Runs the app in development mode. The page will reload automatically when you make changes.

### Running Tests
```bash
npm test
```
Launches the test runner in interactive watch mode.


## Environment Configuration

```env
REACT_APP_API_URL=https://your-backend-domain.com
```

## Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.js       # Navigation header
│   └── LoadingSpinner.js # Loading indicator
├── pages/              # Main application pages
│   ├── Home.js         # Landing page with calorie calculator
│   ├── Login.js        # User login page
│   ├── Register.js     # User registration page
│   ├── Dashboard.js    # User dashboard
│   └── Profile.js      # User profile management
├── services/           # API and external services
│   └── api.js          # Axios configuration and API calls
├── App.js              # Main application component
├── App.css             # Global styles and CSS variables
└── index.js            # Application entry point
```

## API Integration

The frontend communicates with the backend through the following endpoints:

- **Authentication**: `/auth/register`, `/auth/login`, `/auth/profile`
- **Calorie Data**: `/api/get-calories`, `/api/search`, `/api/food/:id`
- **User Data**: Protected routes for user-specific information