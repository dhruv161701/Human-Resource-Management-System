import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    if (storedUser && storedRole && token) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, userRole) => {
    try {
      let response;
      
      if (userRole === 'manager') {
        response = await api.managerLogin(email, password);
      } else {
        response = await api.login(email, password);
      }
      
      const userData = response.user;
      const actualRole = userData.role || userRole;
      
      setUser(userData);
      setRole(actualRole);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', actualRole);

      if (actualRole === 'manager') {
        navigate('/manager/dashboard');
      } else if (actualRole === 'employee') {
        navigate('/employee/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (data) => {
    try {
      const response = await api.signup(data);
      return { success: true, email: response.email, message: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await api.verifyOtp(email, otp);
      
      const userData = response.user;
      setUser(userData);
      setRole(userData.role);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userData.role);

      if (userData.role === 'employee') {
        navigate('/employee/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resendOtp = async (email) => {
    try {
      await api.resendOtp(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, login, signup, verifyOtp, resendOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

