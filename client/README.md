# Expense Tracker - Frontend

A comprehensive expense tracking application built with React 18, Vite 7, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ (recommended: 18+)
- npm or yarn

### Installation

```bash
cd client
npm install
```

### Environment Setup

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

> **Note:** Vite uses `VITE_` prefix for env variables (not `REACT_APP_`).

### Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 🧪 Testing Without Backend (Admin Bypass)

For frontend development and testing without a running backend server, use the admin bypass credentials:

**Email:** `admin@test.com`  
**Password:** `admin123`

This will:
- Skip real API authentication
- Store a mock token (`admin-test-token-12345`)
- Create a mock user in localStorage
- Allow full navigation and UI testing

⚠️ **IMPORTANT:** Remove admin bypass code before production deployment!

### Files with Admin Bypass (search for "admin-test-token-12345"):
- `src/contexts/AuthContext.jsx` (lines ~31-45, ~92-99)
- `src/pages/Login.jsx` (lines ~8, ~20-29)

## 📚 Tech Stack

- **React 18.2** - UI library
- **Vite 7.2** - Build tool
- **React Router 6** - Client-side routing
- **React Query** (@tanstack/react-query) - Server state management
- **Tailwind CSS 3** - Utility-first styling
- **React Hook Form** - Form validation
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications

## 🎯 Features Implemented

### Authentication (Person A)
- ✅ Login page with form validation
- ✅ Registration page with password confirmation
- ✅ Protected routes with auth guards
- ✅ JWT token management
- ✅ Admin bypass for testing

### Core Infrastructure (Person A)
- ✅ Axios API client with interceptors
- ✅ Auth context with user state management
- ✅ Formatting utilities (currency, dates, numbers)
- ✅ Loading spinner component
- ✅ Tailwind component classes (`.input`, `.btn`, `.btn-primary`)

### Upcoming Features
- Dashboard & Analytics (Person B)
- Account Management (Person C)
- Transactions & Categories (Person D)

## 📁 Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── LoadingSpinner.jsx
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/              # Route-level page components
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── utils/              # Helper functions & API client
│   │   ├── api.js          # Axios instance with interceptors
│   │   └── format.js       # Formatting utilities
│   ├── App.jsx             # Main app with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles + Tailwind
├── public/                 # Static assets
├── .env                    # Environment variables (create this)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Tailwind Component Classes

Custom component classes available in `src/index.css`:

```css
/* Form inputs */
.input {
  @apply w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm 
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
         disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Buttons */
.btn {
  @apply inline-flex items-center justify-center rounded-md font-medium transition-colors 
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500;
}
```

## 🌐 API Integration

The app uses an Axios instance (`src/utils/api.js`) that:
- Automatically attaches JWT tokens to requests
- Redirects to login on 401 responses
- Reads base URL from `VITE_API_URL` env variable

Example usage:

```javascript
import { api } from './utils/api';

// GET request
const response = await api.get('/accounts');

// POST request
const result = await api.post('/expenses', { amount: 50, category: 'Food' });
```

## 👥 Team & Development Workflow

- **Person A:** Authentication & Core Infrastructure ✅
- **Person B:** Dashboard & Analytics (In Progress)
- **Person C:** Account Management (Pending)
- **Person D:** Transactions & Categories (Pending)

### Branch Strategy
- `main` - Production-ready code
- `dev` - Integration branch
- `ui` - Current UI development branch
- Feature branches for each team member

## 🚨 Common Issues

### Build fails with "Expression expected"
- Make sure JSX files have `.jsx` extension
- Check that all imports to JSX files include the `.jsx` extension

### Tailwind styles not applying
- Verify `tailwind.config.js` content paths include your file
- Make sure PostCSS and Autoprefixer are configured
- Check that `@tailwind` directives are in `src/index.css`

### API requests fail with CORS
- Backend server must enable CORS
- Check `VITE_API_URL` in `.env` matches backend URL

### Admin bypass not working
- Clear localStorage: `localStorage.clear()`
- Use exact credentials: `admin@test.com` / `admin123`

## 📄 License

CompSci 520 - Group 10 Project

---

**Last Updated:** November 2025  
**Build Status:** ✅ Passing  
**Maintainers:** Group 10 Team
