# CivicTrack - Civic Issue Management Platform

A comprehensive web application for reporting, tracking, and managing civic issues in communities. Built with React frontend and Django backend, featuring real-time location tracking, interactive maps, and admin dashboard.

## 🚀 Features

### Core Features
- **Issue Reporting**: Report civic issues with location, photos, and descriptions
- **Real-time Location**: GPS-based location detection and manual location input
- **Interactive Map**: Leaflet-based map with issue markers and user location
- **Search & Filter**: Advanced filtering by category, status, and distance
- **Pagination**: Efficient data loading with 6 issues per page
- **Admin Dashboard**: Comprehensive admin panel for issue management
- **User Authentication**: Secure login/signup system with token authentication
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Technical Features
- **Real GPS Location**: Actual user GPS coordinates, not fixed locations
- **Map Legend**: Color-coded issue categories with permanent visibility
- **Toast Notifications**: Auto-dismissing notifications (5 seconds)
- **Distance Calculation**: Accurate Haversine formula for distance filtering
- **Image Variety**: Multiple real civic issue images from public folder
- **Cross-origin API**: Proper CORS handling for frontend-backend communication

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Leaflet** - Interactive maps with OpenStreetMap
- **Lucide React** - Beautiful icons

### Backend
- **Django 4.2.7** - Python web framework
- **Django REST Framework** - API development
- **SQLite** - Database (development)
- **Django CORS Headers** - Cross-origin resource sharing
- **Django Filters** - Advanced filtering capabilities
- **Token Authentication** - Secure user authentication

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Python** (v3.8 or higher)
- **pip** (Python package manager)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CivicTrack-main
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Run Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Superuser (Admin)
```bash
python manage.py createsuperuser
# Follow the prompts to create admin credentials
```

#### Load Sample Data (Optional)
```bash
python manage.py load_sample_data
```

#### Start Backend Server
```bash
python manage.py runserver 127.0.0.1:8000
```

The backend API will be available at `http://127.0.0.1:8000/api/`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../
```

#### Install Dependencies
```bash
npm install
```

#### Start Development Server
```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173/`

## 📁 Project Structure

```
CivicTrack-main/
├── backend/                          # Django backend
│   ├── issues/                       # Issues app
│   │   ├── models.py                 # Issue and Category models
│   │   ├── views.py                  # API views
│   │   ├── serializers.py            # Data serializers
│   │   └── management/               # Custom management commands
│   ├── users/                        # User management
│   ├── notifications/                # Notification system
│   ├── requirements.txt              # Python dependencies
│   └── manage.py                     # Django management script
├── src/                              # React frontend
│   ├── components/                   # Reusable components
│   │   ├── Header.tsx               # Navigation header
│   │   ├── IssueCard.tsx            # Issue display card
│   │   └── ui/                      # Shadcn/ui components
│   ├── pages/                       # Page components
│   │   ├── Index.tsx                # Home page
│   │   ├── Login.tsx                # Login page
│   │   ├── Register.tsx             # Registration page
│   │   └── AdminDashboard.tsx       # Admin panel
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-geolocation.ts       # GPS location hook
│   │   └── use-toast.ts             # Toast notifications
│   ├── lib/                         # Utility libraries
│   │   └── api.ts                   # API client functions
│   └── assets/                      # Static assets
├── public/                          # Public assets
│   ├── images/                      # Civic issue images
│   └── favicon.ico                  # Site icon
├── package.json                     # Node.js dependencies
└── README.md                        # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env file in backend directory)
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (.env file in root directory)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### API Endpoints

#### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - User logout

#### Issues
- `GET /api/issues/` - List issues with pagination
- `POST /api/issues/` - Create new issue
- `GET /api/issues/{id}/` - Get issue details
- `PUT /api/issues/{id}/` - Update issue
- `DELETE /api/issues/{id}/` - Delete issue

#### Categories
- `GET /api/categories/` - List all categories

#### Users
- `GET /api/users/profile/` - Get user profile
- `PUT /api/users/profile/` - Update user profile

## 🎯 Key Features Explained

### 1. Real GPS Location
The application uses the browser's Geolocation API to get actual user coordinates:
```typescript
const getCurrentLocation = async () => {
  const locationData = await getCurrentLocation();
  const newLocation = { 
    lat: locationData.latitude, 
    lng: locationData.longitude 
  };
  setUserLocation(newLocation);
};
```

### 2. Interactive Map
Leaflet map with custom markers and popups:
- **User Location**: Blue marker with detailed popup
- **Issue Markers**: Color-coded by category with issue details
- **Map Legend**: Always visible with category colors
- **Zoom Controls**: Custom zoom in/out buttons

### 3. Distance Filtering
Accurate distance calculation using Haversine formula:
```typescript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

### 4. Image Variety
Multiple real civic issue images from public folder:
- `/Pothole on main road.jpg` - Road damage issues
- `/missing manhole cover.jpg` - Safety hazards
- `/illegal parking.jpeg` - Traffic violations
- `/broken street furniture.jpeg` - Infrastructure damage
- `/Road marking faded.webp` - Traffic safety issues
- `/hole.jpeg` - Environmental issues
- `/Street vendor obstruction.jpeg` - Obstruction issues

## 🔐 Authentication

### User Registration
- Email and password validation
- Password strength requirements
- Automatic login after registration

### User Login
- Token-based authentication
- Persistent sessions with localStorage
- Secure logout functionality

### Admin Access
- Special admin dashboard for administrators
- Issue management capabilities
- User management features

## 🗺️ Map Features

### Location Services
- **Get My Location**: Real GPS coordinates
- **Manual Location**: Coordinate input
- **Clear Location**: Reset location data
- **Address Display**: Reverse geocoding

### Map Controls
- **Zoom In/Out**: Custom zoom controls
- **Fullscreen**: Toggle fullscreen mode
- **Legend**: Always visible category legend
- **Markers**: Interactive issue markers

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile-first** design approach
- **Tailwind CSS** responsive utilities
- **Flexible layouts** for all screen sizes
- **Touch-friendly** interface elements

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues
1. **Port Already in Use**
   ```bash
   # Kill process using port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Database Migration Errors**
   ```bash
   python manage.py migrate --run-syncdb
   ```

3. **CORS Errors**
   - Ensure `CORS_ALLOWED_ORIGINS` includes frontend URL
   - Check `django-cors-headers` is installed

#### Frontend Issues
1. **API Connection Errors**
   - Verify backend server is running
   - Check API base URL in environment variables
   - Ensure CORS is properly configured

2. **Location Permission Denied**
   - Check browser location permissions
   - Use manual location input as fallback

3. **Map Not Loading**
   - Check internet connection (OpenStreetMap tiles)
   - Verify Leaflet CSS is imported

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reloading
2. **Debug Mode**: Backend runs in debug mode for detailed error messages
3. **Browser DevTools**: Use for debugging frontend issues
4. **Django Admin**: Access at `http://127.0.0.1:8000/admin/` for data management

## 📊 Performance Optimization

### Frontend
- **Code Splitting**: React Router lazy loading
- **Image Optimization**: Optimized civic issue images
- **Bundle Size**: Vite for fast builds
- **Caching**: React Query for API response caching

### Backend
- **Database Indexing**: Optimized queries
- **Pagination**: Efficient data loading
- **API Caching**: Response caching where appropriate
- **Static Files**: Proper static file serving

## 🔒 Security Features

- **Token Authentication**: Secure user sessions
- **CORS Protection**: Controlled cross-origin requests
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Django ORM protection
- **XSS Protection**: React automatic escaping

## 📈 Future Enhancements

- **Real-time Notifications**: WebSocket integration
- **Image Upload**: User photo upload functionality
- **Mobile App**: React Native mobile application
- **Analytics Dashboard**: Advanced reporting features
- **Email Notifications**: Issue status updates
- **Social Sharing**: Share issues on social media

