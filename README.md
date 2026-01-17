# Hostel Management Frontend

Next.js 16 frontend application for Hostel/PG Management System.

## 🏗️ Architecture

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **HTTP Client**: Axios

## 🚀 Features

- ✅ Modern Next.js 16 App Router
- ✅ Server and Client Components
- ✅ Authentication with JWT
- ✅ Automatic token refresh
- ✅ Role-based routing
- ✅ Responsive design
- ✅ Dashboard with statistics

## 🛠️ Setup

### Prerequisites

- Node.js 20+
- Backend API running (separate server)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   # Copy .env file and edit with your backend API URL
   # See .env.example for required variables
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Application will be available at**
   - http://localhost:3000

## 🔧 Configuration

### Environment Variables

```env
# Backend API URL (REQUIRED)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Application Mode
NEXT_PUBLIC_APP_MODE=SAAS  # or SELF_HOSTED
```

**Important**: The frontend communicates with the backend API via HTTP. Ensure:
- Backend API is accessible from frontend server
- CORS is properly configured on backend
- Backend URL matches `NEXT_PUBLIC_API_URL`

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── dashboard/         # Dashboard routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Sidebar.tsx
│   └── Header.tsx
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   ├── auth.ts           # Auth service
│   └── auth-context.tsx  # Auth context
└── public/               # Static assets
```

## 🔐 Authentication

The frontend handles authentication automatically:

1. **Login**: User logs in, receives tokens
2. **Token Storage**: Tokens stored in cookies
3. **Auto Refresh**: Tokens automatically refreshed before expiry
4. **Logout**: Tokens cleared on logout

### Auth Flow

```typescript
// Login
const { login } = useAuth();
await login(email, password);

// Check auth status
const { user, loading } = useAuth();

// Logout
const { logout } = useAuth();
await logout();
```

## 🎨 Pages & Routes

- `/` - Redirects to login or dashboard
- `/login` - Login page
- `/dashboard` - Main dashboard
- `/dashboard/residents` - Residents management
- `/dashboard/rooms` - Rooms management
- `/dashboard/buildings` - Buildings management
- `/dashboard/payments` - Payments
- `/dashboard/complaints` - Complaints
- `/dashboard/visitors` - Visitors
- `/dashboard/notices` - Notices
- `/dashboard/reports` - Reports
- `/dashboard/settings` - Settings

## 🔄 API Integration

The frontend uses Axios for API calls:

```typescript
import api from '@/lib/api';

// GET request
const response = await api.get('/api/residents');

// POST request
const response = await api.post('/api/residents', data);

// PUT/PATCH request
const response = await api.patch('/api/residents/123', data);

// DELETE request
const response = await api.delete('/api/residents/123');
```

All requests automatically include:
- Authorization header with JWT token
- Automatic token refresh on 401
- Error handling

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

## 🚀 Deployment

### VPS Deployment

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Edit .env and set NEXT_PUBLIC_API_URL to your backend URL
   ```

4. **Build and start**
   ```bash
   npm run build
   npm run start
   ```

## 🌐 Multi-Tenancy

### SaaS Mode
- Frontend detects tenant from subdomain
- Subdomain passed to backend via headers
- Backend handles tenant resolution

### Self-Hosted Mode
- No subdomain logic
- Single tenant (default)

## 🔒 Security

- JWT tokens stored in httpOnly cookies (recommended for production)
- Automatic token refresh
- Protected routes with auth checks
- CORS handled by backend

## 📱 Responsive Design

The frontend is built with Tailwind CSS and is fully responsive:
- Mobile-first approach
- Works on all screen sizes
- Modern UI/UX

## 🔧 Troubleshooting

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running and accessible
- Verify CORS configuration on backend

### Authentication Issues
- Check token storage in cookies
- Verify backend JWT configuration
- Check network requests in browser dev tools

### Build Issues
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version (20+)

---

**Frontend Application - Deploy independently on your VPS**
# nivtestone
