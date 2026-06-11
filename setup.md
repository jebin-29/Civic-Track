# CivicTrack Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **npm** or **yarn** package manager

## Backend Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
1. Create a PostgreSQL database
2. Copy `backend/env.example` to `backend/.env`
3. Update the `DATABASE_URL` in `.env` with your database credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/civictrack"
   ```

### 3. Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### 4. Run Database Migrations
```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Start Backend Server
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3000`

## Frontend Setup

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Start Frontend Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:7532`

## Running Both Applications

### Option 1: Separate Terminals
1. **Terminal 1** (Backend):
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2** (Frontend):
   ```bash
   npm run dev
   ```

### Option 2: Using a Package Manager Script
Create a `package.json` script in the root directory:

```json
{
  "scripts": {
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "npm run dev",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""
  }
}
```

Then run:
```bash
npm run dev
```

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/civictrack"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:7532

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Optional: Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Optional: Redis (for caching)
REDIS_URL=redis://localhost:6379
```

## Common Issues and Solutions

### 1. Database Connection Error
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists

### 2. Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `vite.config.ts`

### 3. Prisma Errors
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate reset` to reset database

### 4. CORS Errors
- Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL
- Check that both servers are running

### 5. File Upload Issues
- Create `uploads` directory in backend: `mkdir backend/uploads`
- Ensure proper permissions on uploads directory

## Testing the Setup

1. **Backend Health Check**: Visit `http://localhost:3000/health`
2. **Frontend**: Visit `http://localhost:7532`
3. **API Documentation**: Visit `http://localhost:3000/api/docs` (if implemented)

## Development Workflow

1. Start both servers
2. Make changes to frontend code (auto-reloads)
3. Make changes to backend code (auto-reloads with nodemon)
4. Test API endpoints using tools like Postman or curl
5. Check logs in both terminal windows for errors

## Production Deployment

For production, you'll need to:
1. Set `NODE_ENV=production`
2. Use a production database
3. Set up proper environment variables
4. Build the frontend: `npm run build`
5. Use a process manager like PM2 for the backend
6. Set up a reverse proxy (nginx) to serve both applications 