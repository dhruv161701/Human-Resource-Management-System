import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeLeave from './pages/employee/EmployeeLeave';
import EmployeeAI from './pages/employee/EmployeeAI';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminLeaves from './pages/admin/AdminLeaves';
import AdminAIInsights from './pages/admin/AdminAIInsights';
import AdminPayroll from './pages/admin/AdminPayroll';
import EmployeePayroll from './pages/employee/EmployeePayroll';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerTimesheets from './pages/manager/ManagerTimesheets';
import ManagerLeaves from './pages/manager/ManagerLeaves';
import ManagerAI from './pages/manager/ManagerAI';

const AppRoutes = () => {
  const { user, role } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    if (role === 'manager') return '/manager/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/employee/dashboard';
  };

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={getDefaultRoute()} replace />} />
      
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute requiredRole="employee">
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="profile" element={<EmployeeProfile />} />
                <Route path="attendance" element={<EmployeeAttendance />} />
                <Route path="payroll" element={<EmployeePayroll />} />
                <Route path="leave" element={<EmployeeLeave />} />
                <Route path="ai" element={<EmployeeAI />} />
                <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/*"
        element={
          <ProtectedRoute requiredRole="manager">
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<ManagerDashboard />} />
                <Route path="timesheets" element={<ManagerTimesheets />} />
                <Route path="leaves" element={<ManagerLeaves />} />
                <Route path="ai" element={<ManagerAI />} />
                <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="employees" element={<AdminEmployees />} />
                <Route path="attendance" element={<AdminAttendance />} />
                <Route path="payroll" element={<AdminPayroll />} />
                <Route path="leaves" element={<AdminLeaves />} />
                <Route path="ai-insights" element={<AdminAIInsights />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
