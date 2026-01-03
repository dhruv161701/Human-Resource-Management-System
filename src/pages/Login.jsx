import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('employee');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, verifyOtp, resendOtp } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await login(email, password, role);
    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    if (!email || !password || !name || !employeeId) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    const result = await signup({
      email,
      password,
      name,
      employee_id: employeeId,
      role: role === 'admin' ? 'admin' : 'employee'
    });

    if (result.success) {
      setSuccess(result.message);
      setShowOtpForm(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    const result = await verifyOtp(email, otp);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await resendOtp(email);
    if (result.success) {
      setSuccess('OTP resent successfully');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (showOtpForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
          <div>
            <h1 className="text-4xl font-bold text-center text-blue-600 mb-2">Dayflow</h1>
            <h2 className="text-2xl font-semibold text-center text-gray-900">
              Verify Your Email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a 6-digit OTP to <strong>{email}</strong>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="w-full text-sm text-blue-600 hover:text-blue-800"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOtpForm(false);
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Back to Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-bold text-center text-blue-600 mb-2">Dayflow</h1>
          <h2 className="text-2xl font-semibold text-center text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={isSignUp ? handleSignUp : handleLogin}>
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="e.g., EMP001"
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={isSignUp ? 'Create a password (min 8 chars)' : 'Enter your password'}
              />
            </div>
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            )}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin/HR</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

