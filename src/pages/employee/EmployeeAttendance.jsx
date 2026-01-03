import { useState, useEffect } from 'react';
import api from '../../services/api';

const EmployeeAttendance = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [timesheetStatus, setTimesheetStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalWeeklyHours, setTotalWeeklyHours] = useState(0);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [remainingLeave, setRemainingLeave] = useState(12);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, weeklyRes, managersRes, statusRes, leavesRes] = await Promise.all([
        api.getTodayAttendance(),
        api.getWeeklyAttendance(),
        api.getManagers(),
        api.getTimesheetStatus(),
        api.getMyLeaves()
      ]);

      setTodayAttendance(todayRes);
      setWeeklyAttendance(weeklyRes.attendance || []);
      setTotalWeeklyHours(weeklyRes.total_hours || 0);
      setWeekStart(weeklyRes.week_start);
      setWeekEnd(weeklyRes.week_end);
      setManagers(managersRes.managers || []);
      setTimesheetStatus(statusRes);
      
      // Calculate pending approvals and remaining leave
      const leaves = leavesRes.leaves || [];
      const pending = leaves.filter(l => l.status === 'Pending').length;
      const approved = leaves.filter(l => l.status === 'Approved').length;
      setPendingApprovals(pending);
      setRemainingLeave(Math.max(0, 12 - approved));
    } catch (err) {
      setError('Failed to load attendance data');
      console.error(err);
    }
    setLoading(false);
  };

  const handleCheckIn = async (date = null) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.checkIn(date);
      setSuccess(`Checked in at ${result.check_in} for ${result.date}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const handleCheckOut = async (date = null) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.checkOut(date);
      setSuccess(`Checked out at ${result.check_out}. Total hours: ${result.total_hours}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const handleSubmitTimesheet = async () => {
    if (!selectedManager) {
      setError('Please select a manager');
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.submitTimesheet(selectedManager);
      setSuccess(`Timesheet submitted successfully to ${result.manager}. Total hours: ${result.total_hours}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isWeekend = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const formatWeekRange = () => {
    if (!weekStart || !weekEnd) return '';
    const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(weekEnd + 'T00:00:00');
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const formatDayHeader = (day) => {
    const date = new Date(day.date + 'T00:00:00');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = date.getDate();
    return { dayName, dayNum };
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-700';
      case 'absent':
        return 'bg-red-100 text-red-600';
      case 'half-day':
        return 'bg-orange-100 text-orange-600';
      case 'leave':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-red-100 text-red-600';
    }
  };

  const getStatusLabel = (status) => {
    if (!status || status.toLowerCase() === 'absent') return 'Absent';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const todayIndex = weeklyAttendance.findIndex(day => isToday(day.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">Track your daily attendance</p>
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

      {/* Weekly Attendance Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Weekly Attendance</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-medium">{formatWeekRange()}</span>
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase w-32"></th>
                {weeklyAttendance.map((day, index) => {
                  const { dayName, dayNum } = formatDayHeader(day);
                  const isTodayCol = isToday(day.date);
                  return (
                    <th key={index} className={`py-4 px-3 text-center ${isTodayCol ? 'bg-blue-600 text-white' : ''}`}>
                      {isTodayCol ? (
                        <div className="text-xs font-medium">CURRENT DAY</div>
                      ) : (
                        <div className="text-xs font-medium text-gray-500">{dayName} {dayNum}</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Check-in Time Row */}
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-sm text-gray-500">Check In</td>
                {weeklyAttendance.map((day, index) => {
                  const isTodayCol = isToday(day.date);
                  return (
                    <td key={index} className={`py-4 px-3 text-center ${isTodayCol ? 'bg-blue-50' : ''}`}>
                      <span className={`text-sm ${isTodayCol ? 'font-semibold text-blue-900' : 'text-gray-900'}`}>
                        {day.check_in || '-'}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Check In/Out Button Row */}
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-sm text-gray-500">Action</td>
                {weeklyAttendance.map((day, index) => {
                  const isTodayCol = isToday(day.date);
                  const isWeekendDay = isWeekend(day.date);
                  return (
                    <td key={index} className={`py-4 px-3 text-center ${isTodayCol ? 'bg-blue-50' : ''}`}>
                      {isWeekendDay ? (
                        <span className="text-xs text-gray-400 font-medium">Weekend</span>
                      ) : !day.check_in ? (
                        <button
                          onClick={() => handleCheckIn(day.date)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 disabled:opacity-50"
                        >
                          Check In
                        </button>
                      ) : !day.check_out ? (
                        <button
                          onClick={() => handleCheckOut(day.date)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 disabled:opacity-50"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">Completed</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Check-out Time Row */}
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-sm text-gray-500">Check Out</td>
                {weeklyAttendance.map((day, index) => {
                  const isTodayCol = isToday(day.date);
                  return (
                    <td key={index} className={`py-4 px-3 text-center ${isTodayCol ? 'bg-blue-50' : ''}`}>
                      <span className={`text-sm ${isTodayCol ? 'font-semibold text-blue-900' : 'text-gray-900'}`}>
                        {day.check_out || '-'}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Mode Row */}
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-sm text-gray-500">Mode</td>
                {weeklyAttendance.map((day, index) => {
                  const isTodayCol = isToday(day.date);
                  return (
                    <td key={index} className={`py-4 px-3 text-center ${isTodayCol ? 'bg-blue-50' : ''}`}>
                      <span className={`text-sm ${isTodayCol ? 'text-blue-900' : 'text-gray-600'}`}>
                        {day.check_in ? (day.mode || 'On-Site') : '-'}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Status Row */}
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-sm text-gray-500">Status</td>
                {weeklyAttendance.map((day, index) => {
                  const isTodayCol = isToday(day.date);
                  const isWeekendDay = isWeekend(day.date);
                  const status = isWeekendDay ? 'Weekend' : (day.check_in ? (day.status || 'Present') : 'Absent');
                  return (
                    <td key={index} className={`py-4 px-3 text-center ${isTodayCol ? 'bg-blue-50' : ''}`}>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${isWeekendDay ? 'bg-gray-100 text-gray-500' : getStatusColor(status)}`}>
                        {isWeekendDay ? 'Weekend' : getStatusLabel(status)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">Today's Log</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-gray-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-gray-600">Present</span>
          </div>
        </div>

        {/* Manager Selection & Submit Row */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Submit Timesheet To:</label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select Manager</option>
                {managers.map((manager) => (
                  <option key={manager.manager_id} value={manager.manager_id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSubmitTimesheet}
              disabled={actionLoading || !selectedManager || timesheetStatus?.submitted}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Submitting...' : timesheetStatus?.submitted ? 'Already Submitted' : 'Submit Timesheet'}
            </button>
          </div>
          {timesheetStatus?.submitted && (
            <div className={`mt-3 p-3 rounded-lg ${
              timesheetStatus.status === 'approved' ? 'bg-green-100 text-green-800' :
              timesheetStatus.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              <span className="text-sm font-medium">
                Timesheet {timesheetStatus.status} - Submitted to {timesheetStatus.manager_name}
                {timesheetStatus.comments && ` | Comments: ${timesheetStatus.comments}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Hours This Week */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Hours This Week</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{totalWeeklyHours}h</span>
            <span className="text-sm text-green-500 font-medium">+2h vs last week</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Pending Approvals</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{pendingApprovals}</span>
            <span className="text-sm text-gray-500">requests</span>
          </div>
        </div>

        {/* Remaining Leave */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Remaining Leave</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{remainingLeave}</span>
            <span className="text-sm text-gray-500">days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;

