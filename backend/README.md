# Civic Zone Connect - Django Backend

A complete Django REST API backend for the Civic Zone Connect application, providing issue reporting, user management, and community engagement features.

## Features

- **User Management**: Registration, authentication, profiles, and admin controls
- **Issue Reporting**: Create, track, and manage community issues with photos and location
- **Categories**: Organized issue categorization system
- **Comments & Voting**: Community engagement features
- **Admin Dashboard**: Comprehensive admin interface for issue and user management
- **Notifications**: Real-time notification system
- **Geolocation**: Location-based issue discovery and management
- **File Upload**: Photo upload and management for issues
- **API Documentation**: Complete REST API with filtering and search

## Technology Stack

- **Django 4.2.7**: Web framework
- **Django REST Framework**: API framework
- **PostgreSQL with PostGIS**: Database with geospatial support
- **Django CORS Headers**: Cross-origin resource sharing
- **Pillow**: Image processing
- **Celery**: Background task processing
- **Redis**: Caching and message broker

## Installation

### Prerequisites

- Python 3.8+
- PostgreSQL 12+ with PostGIS extension
- Redis (optional, for Celery)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CivicTrack-main/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE civic_zone_connect;
   CREATE EXTENSION postgis;
   ```

6. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

8. **Load initial data**
   ```bash
   python manage.py loaddata initial_data.json
   ```

9. **Run the development server**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/change-password/` - Change password

### Users
- `GET /api/profile/` - Get user profile
- `PUT /api/profile/update/` - Update user profile
- `POST /api/profile/location/` - Update user location
- `GET /api/current-user/` - Get current user info

### Issues
- `GET /api/issues/` - List issues with filtering
- `POST /api/issues/create/` - Create new issue
- `GET /api/issues/{id}/` - Get issue details
- `PUT /api/issues/{id}/update/` - Update issue (admin)
- `POST /api/issues/{id}/comment/` - Add comment
- `POST /api/issues/{id}/vote/` - Vote on issue
- `POST /api/issues/{id}/flag/` - Flag issue
- `GET /api/my-issues/` - Get user's issues
- `GET /api/nearby-issues/` - Get nearby issues

### Categories
- `GET /api/categories/` - List categories

### Notifications
- `GET /api/notifications/` - List user notifications
- `GET /api/notifications/unread/` - List unread notifications
- `POST /api/notifications/mark-read/` - Mark notifications as read
- `GET /api/notifications/count/` - Get notification counts
- `GET /api/notifications/preferences/` - Get notification preferences

### Admin Endpoints
- `GET /api/admin/users/` - List all users
- `GET /api/admin/issues/` - List all issues
- `GET /api/admin/statistics/` - Get admin statistics
- `POST /api/admin/notifications/send-system/` - Send system notifications

## Models

### User Models
- **User**: Custom user model with extended fields
- **UserProfile**: Extended user profile information
- **UserSession**: User session tracking

### Issue Models
- **Category**: Issue categories
- **Issue**: Main issue model with geospatial support
- **IssuePhoto**: Photos attached to issues
- **IssueComment**: Comments on issues
- **IssueUpdate**: Status updates and tracking
- **IssueAssignment**: Issue assignments to users
- **IssueVote**: Voting system
- **IssueFlag**: Issue flagging system

### Notification Models
- **Notification**: User notifications
- **NotificationPreference**: User notification preferences
- **NotificationTemplate**: Notification templates

## Admin Interface

Access the Django admin interface at `/admin/` to manage:
- Users and user profiles
- Issues and categories
- Comments and votes
- Notifications and templates
- System settings

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
```

### Database Backup
```bash
python manage.py dumpdata > backup.json
```

### Database Restore
```bash
python manage.py loaddata backup.json
```

## Deployment

### Production Settings
1. Set `DEBUG=False` in settings
2. Configure production database
3. Set up static file serving
4. Configure email settings
5. Set up SSL/HTTPS
6. Configure CORS for production domains

### Docker Deployment
```bash
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository. 