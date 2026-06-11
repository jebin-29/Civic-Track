# Quick Start Guide - Civic Zone Connect Backend

## 🚀 Quick Setup (5 minutes)

### Option 1: Using Docker (Recommended)

1. **Clone and navigate to backend**
   ```bash
   cd CivicTrack-main/backend
   ```

2. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations and load data**
   ```bash
   docker-compose exec web python manage.py migrate
   docker-compose exec web python manage.py load_initial_data
   docker-compose exec web python manage.py load_notification_templates
   docker-compose exec web python manage.py createsuperuser
   ```

4. **Access the application**
   - API: http://localhost:8000/api/
   - Admin: http://localhost:8000/admin/

### Option 2: Local Development

1. **Prerequisites**
   - Python 3.8+
   - PostgreSQL with PostGIS
   - Redis (optional)

2. **Setup**
   ```bash
   cd CivicTrack-main/backend
   python setup.py
   ```

3. **Configure environment**
   ```bash
   # Edit .env file with your settings
   cp env.example .env
   # Edit .env file
   ```

4. **Run the server**
   ```bash
   python manage.py runserver
   ```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout

### Issues
- `GET /api/issues/` - List all issues
- `POST /api/issues/create/` - Create new issue
- `GET /api/issues/{id}/` - Get issue details
- `POST /api/issues/{id}/comment/` - Add comment

### Users
- `GET /api/profile/` - Get user profile
- `GET /api/my-issues/` - Get user's issues

### Admin
- `GET /api/admin/statistics/` - Get admin stats
- `GET /api/admin/users/` - List all users

## 🔧 Key Features

### ✅ Complete User Management
- User registration and authentication
- User profiles with extended information
- Admin user management
- Session tracking

### ✅ Issue Management
- Create and track community issues
- Photo uploads for issues
- Location-based issue discovery
- Issue categorization system
- Status tracking (reported, progress, resolved)

### ✅ Community Features
- Comments on issues
- Voting system (upvote/downvote)
- Issue flagging for moderation
- Anonymous reporting option

### ✅ Admin Dashboard
- Comprehensive admin interface
- User management and moderation
- Issue statistics and analytics
- System notification sending

### ✅ Notifications
- Real-time notification system
- Email and push notification support
- Customizable notification preferences
- Notification templates

### ✅ Geolocation
- PostGIS integration for spatial data
- Location-based issue discovery
- Nearby issues functionality
- Distance calculations

## 🗄️ Database Models

### Core Models
- **User**: Custom user model with extended fields
- **Issue**: Main issue model with geospatial support
- **Category**: Issue categorization
- **Notification**: User notification system

### Related Models
- **IssuePhoto**: Photo attachments
- **IssueComment**: Comments system
- **IssueVote**: Voting system
- **IssueFlag**: Moderation system
- **UserProfile**: Extended user information

## 🔐 Security Features

- JWT token authentication
- CORS configuration
- File upload validation
- Admin permission system
- Rate limiting support
- SQL injection protection

## 📊 Admin Interface

Access the Django admin at `/admin/` to manage:
- Users and profiles
- Issues and categories
- Comments and votes
- Notifications
- System settings

## 🚀 Production Deployment

### Environment Variables
```bash
DEBUG=False
SECRET_KEY=your-production-secret-key
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users
python manage.py test issues
python manage.py test notifications
```

## 📝 API Documentation

The API follows REST conventions:
- GET for retrieving data
- POST for creating data
- PUT for updating data
- DELETE for removing data

All endpoints return JSON responses with appropriate HTTP status codes.

## 🔧 Customization

### Adding New Categories
```python
# In Django shell or management command
from issues.models import Category
Category.objects.create(
    name="New Category",
    description="Description",
    icon="icon-name",
    color="#FF0000"
)
```

### Custom Notification Templates
```python
# In Django admin or management command
from notifications.models import NotificationTemplate
NotificationTemplate.objects.create(
    name="Custom Template",
    notification_type="custom_type",
    title_template="Custom Title: {{ variable }}",
    message_template="Custom message with {{ variable }}"
)
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify database credentials in .env
   - Ensure PostGIS extension is installed

2. **Migration Errors**
   ```bash
   python manage.py makemigrations --merge
   python manage.py migrate
   ```

3. **Static Files Not Loading**
   ```bash
   python manage.py collectstatic
   ```

4. **Permission Errors**
   - Check file permissions
   - Ensure virtual environment is activated
   - Verify user has database access

## 📞 Support

For issues and questions:
1. Check the main README.md
2. Review API documentation
3. Check Django logs in `/logs/`
4. Create an issue in the repository

---

**Happy coding! 🎉** 