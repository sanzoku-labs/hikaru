# How to Use Hikaru Authentication

## Test Account

We have a test account already created:

**Email**: `admin@hikaru.ai`  
**Username**: `admin`  
**Password**: `Admin123`  

## How It Works

### 1. Starting the Application

**Backend (Terminal 1)**:
```bash
cd backend
poetry run uvicorn app.main:app --reload --port 8000
```

**Frontend (Terminal 2)**:
```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5173

### 2. User Flow

#### First-Time Users (Registration)
1. Visit http://localhost:5173
2. You'll be redirected to http://localhost:5173/login
3. Click "Sign up" link at the bottom
4. Fill out the registration form:
   - **Email**: Valid email address
   - **Username**: 3-50 chars, alphanumeric + underscore/hyphen
   - **Full Name**: Optional
   - **Password**: Must have:
     - At least 8 characters
     - One uppercase letter
     - One lowercase letter
     - One digit
   - **Confirm Password**: Must match
5. Click "Sign Up"
6. You'll be automatically logged in and redirected to the dashboard

#### Returning Users (Login)
1. Visit http://localhost:5173
2. You'll be redirected to http://localhost:5173/login
3. Enter credentials:
   - **Username or Email**: `admin` or `admin@hikaru.ai`
   - **Password**: `Admin123`
4. Click "Sign In"
5. You'll be redirected to the dashboard

### 3. Using the Dashboard (Authenticated)

Once logged in:
- Your username/email appears in the top-right corner
- Upload files - they'll be associated with your account
- All your data is isolated from other users
- Click the logout icon (⎋) to sign out

### 4. What Happens Behind the Scenes

**On Registration/Login**:
1. Server validates credentials
2. Server generates JWT token (valid for 7 days)
3. Server creates session record in database
4. Frontend stores token in localStorage
5. Frontend stores user info in localStorage

**On Subsequent Requests**:
1. Frontend reads token from localStorage
2. All API requests include `Authorization: Bearer <token>` header
3. Backend validates token on protected endpoints
4. Backend checks if session is revoked
5. Backend associates data with user ID

**On Logout**:
1. Frontend sends logout request
2. Backend marks session as revoked
3. Frontend clears token from localStorage
4. User is redirected to login page

### 5. Testing with cURL

**Register a new user**:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test1234",
    "full_name": "Test User"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "admin",
    "password": "Admin123"
  }'
```

Response will include:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@hikaru.ai",
    "username": "admin",
    "full_name": "Admin User",
    "is_active": true,
    "is_superuser": false,
    "created_at": "2025-11-10T23:34:51.584166"
  }
}
```

**Use token for authenticated requests**:
```bash
TOKEN="your-token-here"

# Upload file
curl -X POST http://localhost:8000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@yourfile.csv"
```

### 6. Database Inspection

**View all users**:
```bash
sqlite3 backend/hikaru.db "SELECT id, email, username, created_at FROM users;"
```

**View active sessions**:
```bash
sqlite3 backend/hikaru.db "SELECT user_id, token_jti, created_at, expires_at, is_revoked FROM sessions;"
```

**View user uploads**:
```bash
sqlite3 backend/hikaru.db "SELECT u.username, up.filename, up.uploaded_at FROM uploads up JOIN users u ON up.user_id = u.id;"
```

### 7. Security Features

- **Password Hashing**: Bcrypt with salt (one-way, cannot be decrypted)
- **JWT Tokens**: Signed with secret key, 7-day expiration
- **Session Tracking**: Can revoke tokens server-side
- **User Isolation**: Each user only sees their own uploads
- **Protected Routes**: All data endpoints require authentication

### 8. Troubleshooting

**"Could not validate credentials" error**:
- Token expired (7 days)
- Token was revoked (logged out)
- Invalid token format
- Solution: Log in again

**"Email already registered" error**:
- Email is already in use
- Solution: Use different email or login instead

**"Username already taken" error**:
- Username is already in use
- Solution: Choose different username

**Upload fails with 401**:
- Not authenticated
- Token expired
- Solution: Log in again

**Frontend shows loading forever**:
- Backend not running
- CORS issue
- Solution: Check backend is running on port 8000

### 9. Environment Configuration

**Backend (.env)**:
```env
# Database
DATABASE_URL=sqlite:///./hikaru.db  # Or postgresql://user:pass@host/db

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:5173
```

**Frontend (.env)**:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 10. Multi-User Testing

To test user isolation:

1. Register User A:
   - Email: `usera@test.com`
   - Username: `usera`
   - Password: `TestA123`

2. Upload a file as User A

3. Logout

4. Register User B:
   - Email: `userb@test.com`
   - Username: `userb`
   - Password: `TestB123`

5. Upload a file as User B

6. Verify: User B cannot see User A's uploads (data isolation works!)

### 11. Production Checklist

Before deploying to production:

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS (TLS/SSL)
- [ ] Set secure CORS origins (whitelist your domain)
- [ ] Configure rate limiting
- [ ] Set up password reset flow
- [ ] Add email verification
- [ ] Implement 2FA (optional)
- [ ] Set up monitoring for failed login attempts
- [ ] Configure backup strategy for database

## Summary

The authentication system is fully functional! You can:
- ✅ Register new users
- ✅ Login with username or email
- ✅ Upload files (user-scoped)
- ✅ Logout and revoke sessions
- ✅ Test with the existing admin account
- ✅ Test user isolation with multiple accounts

For any issues, check the backend logs or browser console for error messages.
