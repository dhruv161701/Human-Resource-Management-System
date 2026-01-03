# Dayflow HRMS Backend

Flask-based REST API backend for the Dayflow Human Resource Management System.

## Features

- **Authentication**: JWT-based authentication with email OTP verification
- **Employee Management**: Profile management, document uploads
- **Attendance Tracking**: Daily check-in/check-out with weekly timesheet submission
- **Leave Management**: Apply, track, and manage leave requests
- **Manager Panel**: Timesheet approval/rejection workflow
- **Admin Dashboard**: Employee management, attendance overview, leave approvals
- **Google Cloud Storage**: Document and profile picture storage

## Prerequisites

- Python 3.9+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Storage account (optional, for document storage)
- SMTP email account (for OTP verification)

## Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables** in the parent `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   
   # SMTP Configuration
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_ADDRESS=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   
   # Google Cloud Storage (optional)
   x-goog-project-id=your-project-id
   google_cloud_storage_account=your-service-account
   
   # JWT Secret (optional - has default)
   JWT_SECRET_KEY=your-secret-key
   ```

5. **Run the server**:
   ```bash
   python app.py
   ```

   The server will start at `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user (sends OTP) |
| POST | `/verify-otp` | Verify OTP and complete registration |
| POST | `/resend-otp` | Resend OTP to email |
| POST | `/login` | User login |
| POST | `/manager/login` | Manager login |
| GET | `/me` | Get current user info |

### Employee (`/api/employee`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get employee profile |
| PUT | `/profile` | Update profile (limited fields) |
| POST | `/profile/picture` | Upload profile picture |
| POST | `/documents` | Upload document |
| DELETE | `/documents/<index>` | Delete document |
| GET | `/salary` | Get salary details |

### Attendance (`/api/attendance`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/check-in` | Employee check-in |
| POST | `/check-out` | Employee check-out |
| GET | `/today` | Get today's attendance |
| GET | `/weekly` | Get weekly attendance |
| GET | `/history` | Get attendance history |
| GET | `/managers` | Get list of managers |
| GET | `/can-submit-timesheet` | Check if can submit timesheet |

### Timesheet (`/api/timesheet`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/submit` | Submit weekly timesheet |
| GET | `/status` | Get current week status |
| GET | `/history` | Get timesheet history |
| GET | `/manager/pending` | Get pending timesheets (manager) |
| GET | `/manager/all` | Get all timesheets (manager) |
| POST | `/manager/review` | Approve/reject timesheet |

### Leave (`/api/leave`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/apply` | Apply for leave |
| GET | `/my-leaves` | Get employee's leaves |
| DELETE | `/cancel/<id>` | Cancel pending leave |
| GET | `/admin/all` | Get all leaves (admin) |
| GET | `/admin/pending` | Get pending leaves (admin) |
| POST | `/admin/review` | Approve/reject leave |

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees` | Get all employees |
| GET | `/employees/<id>` | Get employee details |
| PUT | `/employees/<id>` | Update employee |
| PUT | `/employees/<id>/salary` | Update salary |
| GET | `/attendance/all` | Get all attendance |
| GET | `/dashboard/stats` | Get dashboard stats |
| GET | `/departments` | Get departments list |

## Database Collections

The system automatically creates the following MongoDB collections:

- `users` - Employee and admin accounts
- `managers` - Manager accounts (pre-seeded)
- `otp_verifications` - OTP records (auto-expire)
- `attendance` - Daily attendance records
- `timesheets` - Weekly timesheet submissions
- `leaves` - Leave requests

## Default Managers

Three managers are pre-seeded in the database:

| Name | Email | Default Password |
|------|-------|------------------|
| Amit Singh | amit.singh@company.com | Manager@123 |
| Suresh Chauhan | suresh.chauhan@company.com | Manager@123 |
| Rekha Agarwal | rekha.agarwal@company.com | Manager@123 |

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Password strength validation
- Email verification via OTP
- Role-based access control
- CORS protection

## Timesheet Workflow

1. Employees check-in/check-out daily (9 AM - 6 PM)
2. Total hours calculated on check-out
3. Timesheet submission available on Friday/Saturday/Sunday
4. Employee selects manager for approval
5. Manager reviews and approves/rejects
6. Employee notified via email
7. Next week attendance only allowed after approval

## Development

```bash
# Run in debug mode
python app.py

# The server runs with debug=True by default
```

## Production Deployment

For production, consider:

1. Set `debug=False` in `app.py`
2. Use a production WSGI server (gunicorn, uWSGI)
3. Set up proper environment variables
4. Configure HTTPS
5. Set up proper CORS origins
6. Use a production MongoDB instance

```bash
# Example with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```
