import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import api from '../../services/api';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    pending_timesheets: 0,
    total_employees: 0,
    present_today: 0,
    pending_leaves: 0
  });
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, timesheetsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getPendingTimesheets()
      ]);
      setStats(statsRes);
      setPendingTimesheets(timesheetsRes.timesheets || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
    setLoading(false);
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your team's activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Timesheets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_timesheets}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_employees}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Present Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.present_today}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Leaves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_leaves}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Timesheets */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Pending Timesheet Approvals</h2>
          <Link 
            to="/manager/timesheets" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </Link>
        </div>

        {pendingTimesheets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2">No pending timesheets</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingTimesheets.slice(0, 5).map((timesheet) => (
                  <tr key={timesheet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{timesheet.employee_name}</p>
                        <p className="text-sm text-gray-500">{timesheet.employee_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.week_start} to {timesheet.week_end}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {timesheet.total_hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(timesheet.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/manager/timesheets?employee=${timesheet.employee_id}&week=${timesheet.week_start}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/manager/timesheets"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Review Timesheets</span>
            </Link>
            <Link
              to="/manager/leaves"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Manage Leave Requests</span>
            </Link>
            <Link
              to="/employee/dashboard"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Switch to Employee Portal</span>
            </Link>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manager Info</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              As a manager, you can:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
              <li>Review and approve/reject employee timesheets</li>
              <li>View team attendance records</li>
              <li>Manage leave requests</li>
              <li>Access the employee portal for your own attendance</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
