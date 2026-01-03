import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    attendanceAlerts: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, leavesRes, attendanceRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAllLeaves(null, 5),
        api.getAllAttendance(new Date().toISOString().split('T')[0], null, 10)
      ]);

      setStats({
        totalEmployees: statsRes.total_employees || 0,
        presentToday: statsRes.present_today || 0,
        pendingLeaves: statsRes.pending_leaves || 0,
        attendanceAlerts: statsRes.attendance_alerts || 0
      });

      setRecentLeaves(leavesRes.leaves || []);
      setRecentAttendance(attendanceRes.attendance || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'text-blue-600',
    },
    {
      title: 'Employees Present Today',
      value: stats.presentToday,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-green-600',
    },
    {
      title: 'Pending Leave Requests',
      value: stats.pendingLeaves,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'text-yellow-600',
    },
    {
      title: 'Attendance Alerts',
      value: stats.attendanceAlerts,
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      color: 'text-red-600',
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
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your organization</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-md ${stat.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Leave Requests</h2>
          <div className="space-y-3">
            {recentLeaves.length === 0 ? (
              <p className="text-sm text-gray-500">No leave requests found</p>
            ) : (
              recentLeaves.map((leave, index) => (
                <div key={leave.id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{leave.employee_name || 'Employee'}</p>
                    <p className="text-xs text-gray-500">
                      {leave.leave_type} - {new Date(leave.start_date).toLocaleDateString()}
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
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity</p>
            ) : (
              recentAttendance.map((att, index) => (
                <div key={att.id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{att.employee_name || 'Employee'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(att.date).toLocaleDateString()} - {att.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

