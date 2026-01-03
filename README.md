# Dayflow - Human Resource Management System

A comprehensive HRMS (Human Resource Management System) built with React, Flask, and MongoDB. This system provides complete HR management capabilities including employee management, attendance tracking, leave management, payroll processing, and document management.

## Features

### Employee Portal
- **Dashboard** - Overview of attendance, leave balance, and pending approvals
- **Profile Management** - View and update personal information, upload profile picture
- **Attendance** - Check-in/check-out, view weekly attendance, submit timesheets
- **Payroll** - View salary structure and payslip history (read-only)
- **Leave Requests** - Apply for leave, view leave history and status
- **AI Assistant** - Get HR-related assistance

### Manager Portal
- **Dashboard** - Team overview and pending approvals
- **Timesheet Approval** - Review and approve/reject employee timesheets
- **Leave Approval** - Review and approve/reject leave requests

### Admin Portal
- **Dashboard** - Organization-wide statistics and insights
- **Employee Management** - View, edit employee details, manage salary structure, request documents
- **Attendance Management** - View all employee attendance records
- **Payroll Management** - Configure salaries, generate payslips, manage payroll
- **Leave Approval** - Review all leave requests with "Approved By" tracking
- **Document Review** - Review uploaded documents, approve or request re-upload
- **AI Insights** - HR analytics and insights

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **TailwindCSS** - Styling
- **Context API** - State management

### Backend
- **Flask** - Python web framework
- **Flask-JWT-Extended** - JWT authentication
- **PyMongo** - MongoDB driver
- **Azure Blob Storage** - Document storage
- **SMTP** - Email notifications

### Database
- **MongoDB Atlas** - Cloud database

## Project Structure

```
├── src/                          # Frontend source
│   ├── components/               # Reusable UI components
│   ├── contexts/                 # React contexts (Auth)
│   ├── layouts/                  # Page layouts
│   ├── pages/                    # Page components
│   │   ├── admin/               # Admin panel pages
│   │   ├── employee/            # Employee panel pages
│   │   └── manager/             # Manager panel pages
│   └── services/                # API service
├── backend/                      # Backend source
│   ├── routes/                  # API route handlers
│   │   ├── auth.py             # Authentication routes
│   │   ├── employee.py         # Employee routes
│   │   ├── attendance.py       # Attendance routes
│   │   ├── leave.py            # Leave management routes
│   │   ├── timesheet.py        # Timesheet routes
│   │   ├── payroll.py          # Payroll routes
│   │   ├── documents.py        # Document management routes
│   │   └── admin.py            # Admin routes
│   ├── utils/                   # Utility modules
│   │   ├── azure_storage.py    # Azure Blob Storage service
│   │   └── email_service.py    # Email notification service
│   ├── app.py                   # Flask application
│   ├── config.py                # Configuration
│   └── database.py              # Database connection
└── public/                       # Static assets
```

## Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account
- Azure Storage account (for document uploads)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

The backend API will be available at `http://localhost:5000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=HRMS

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
AZURE_STORAGE_CONTAINER_NAME=dayflow-hrms
```

## Default Credentials

### Admin
- **Email:** dayflow@gmail.com
- **Password:** admin123@

### Managers
- **Password:** dayflowmanager123

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Employee registration
- `POST /api/auth/login` - Employee login
- `POST /api/auth/manager/login` - Manager login
- `POST /api/auth/verify-otp` - OTP verification

### Employee
- `GET /api/employee/profile` - Get profile
- `PUT /api/employee/profile` - Update profile
- `POST /api/employee/profile-picture` - Upload profile picture

### Attendance
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/weekly` - Get weekly attendance
- `GET /api/attendance/today` - Get today's attendance

### Leave
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/my-leaves` - Get my leaves
- `GET /api/leave/admin/all` - Get all leaves (Admin)
- `POST /api/leave/admin/review` - Review leave request

### Payroll
- `GET /api/payroll/my-payslips` - Get my payslips
- `GET /api/payroll/admin/employees` - Get all employees (Admin)
- `POST /api/payroll/admin/generate-payslip` - Generate payslip

### Documents
- `POST /api/documents/request` - Request document from employee
- `POST /api/documents/upload/:id` - Upload requested document
- `POST /api/documents/admin/review` - Review uploaded document

## Key Features Explained

### Attendance System
- Employees can check-in/check-out for any day in the current week
- Weekly attendance starts from Monday (configurable)
- Weekends are automatically marked
- Timesheet submission on weekly basis

### Payroll Management
- Admin can configure salary structure (Basic, HRA, Allowances, Deductions)
- Generate monthly payslips
- Employees can view salary structure and payslip history (read-only)

### Document Management
- Admin can request specific documents from employees
- Email notifications sent to employees
- Employees upload documents from their profile
- Admin reviews and approves/requests re-upload
- Documents stored in Azure Blob Storage

### Leave Management
- Multiple leave types: Paid Leave, Sick Leave, Unpaid Leave
- Manager/Admin approval workflow
- "Approved By" tracking shows which manager approved

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
