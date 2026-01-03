import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timesheetStatus, setTimesheetStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [todayRes, weeklyRes, leavesRes, timesheetRes] = await Promise.all([
        api.getTodayAttendance(),
        api.getWeeklyAttendance(),
        api.getMyLeaves(),
        api.getTimesheetStatus()
      ]);

      setTodayAttendance(todayRes);
      setWeeklyAttendance(weeklyRes.attendance || []);
      setLeaves(leavesRes.leaves || []);
      setTimesheetStatus(timesheetRes);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
    setLoading(false);
  };

  const approvedLeaves = leaves.filter((l) => l.status === 'Approved').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const totalHoursThisWeek = weeklyAttendance.reduce((sum, day) => sum + (day.total_hours || 0), 0);

  const stats = [
    {
      title: "Today's Status",
      value: todayAttendance?.check_in ? (todayAttendance?.check_out ? 'Completed' : 'Checked In') : 'Not Checked In',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: todayAttendance?.check_in ? 'text-green-600' : 'text-gray-600',
      bgColor: todayAttendance?.check_in ? 'bg-green-100' : 'bg-gray-100',
    },
    {
      title: 'Weekly Hours',
      value: `${totalHoursThisWeek}h`,
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Approved Leaves',
      value: approvedLeaves,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Pending Leaves',
      value: pendingLeaves,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back, {user?.name || 'Employee'}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-md ${stat.bgColor}`}>
                  <svg className={`h-6 w-6 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Timesheet Status Alert */}
      {timesheetStatus?.submitted && (
        <div className={`p-4 rounded-lg ${
          timesheetStatus.status === 'approved' ? 'bg-green-50 border border-green-200' :
          timesheetStatus.status === 'rejected' ? 'bg-red-50 border border-red-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {timesheetStatus.status === 'approved' && (
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {timesheetStatus.status === 'rejected' && (
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {timesheetStatus.status === 'pending' && (
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <p className={`font-medium ${
                timesheetStatus.status === 'approved' ? 'text-green-800' :
                timesheetStatus.status === 'rejected' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                Timesheet {timesheetStatus.status.charAt(0).toUpperCase() + timesheetStatus.status.slice(1)}
              </p>
              <p className="text-sm text-gray-600">
                Week: {timesheetStatus.week_start} to {timesheetStatus.week_end} | Hours: {timesheetStatus.total_hours}h
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Attendance */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">This Week's Attendance</h2>
            <Link to="/employee/attendance" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {weeklyAttendance.slice(0, 5).map((att, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {att.day}, {new Date(att.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {att.check_in ? `${att.check_in} - ${att.check_out || 'Not checked out'}` : 'No record'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {att.total_hours > 0 && (
                    <span className="text-xs text-gray-500">{att.total_hours}h</span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      att.status === 'Present'
                        ? 'bg-green-100 text-green-800'
                        : att.status === 'Absent'
                        ? 'bg-red-100 text-red-800'
                        : att.status === 'Leave'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {att.status || 'Absent'}
                  </span>
                </div>
              </div>
            ))}
            {weeklyAttendance.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No attendance records this week</p>
            )}
          </div>
        </Card>

        {/* Recent Leave Requests */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leave Requests</h2>
            <Link to="/employee/leave" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {leaves.slice(0, 5).map((leave) => (
              <div key={leave.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{leave.leave_type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(leave.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    leave.status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : leave.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {leave.status}
                </span>
              </div>
            ))}
            {leaves.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No leave requests yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/employee/attendance"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="p-3 bg-blue-100 rounded-full mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Attendance</span>
          </Link>
          <Link
            to="/employee/leave"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="p-3 bg-green-100 rounded-full mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Apply Leave</span>
          </Link>
          <Link
            to="/employee/profile"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="p-3 bg-purple-100 rounded-full mb-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">My Profile</span>
          </Link>
          <Link
            to="/employee/ai"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="p-3 bg-yellow-100 rounded-full mb-2">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">AI Assistant</span>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;

