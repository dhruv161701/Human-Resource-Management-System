import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow managers to access employee routes
  if (requiredRole === 'employee' && role === 'manager') {
    return children;
  }

  // Allow admins to access all routes
  if (role === 'admin') {
    return children;
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect based on user's role
    if (role === 'employee') {
      return <Navigate to="/employee/dashboard" replace />;
    } else if (role === 'manager') {
      return <Navigate to="/manager/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

