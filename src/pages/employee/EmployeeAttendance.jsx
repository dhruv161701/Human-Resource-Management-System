import { useState } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { getCurrentEmployee, getEmployeeAttendance } from '../../data/mockData';

const EmployeeAttendance = () => {
  const employee = getCurrentEmployee();
  const attendance = getEmployeeAttendance(employee.id);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);

  const handleCheckIn = () => {
    setCheckedIn(true);
    setCheckInTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
    setCheckInTime(null);
  };

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'present';
      case 'absent':
        return 'absent';
      case 'half-day':
        return 'half-day';
      case 'leave':
        return 'leave';
      default:
        return 'default';
    }
  };

  // Get current week's attendance
  const today = new Date();
  const currentWeek = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    const dateStr = date.toISOString().split('T')[0];
    const att = attendance.find((a) => a.date === dateStr);
    currentWeek.push({
      date: dateStr,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      ...att,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">Track your daily attendance</p>
      </div>

      <Card>
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Today's Attendance</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!checkedIn ? (
              <button
                onClick={handleCheckIn}
                className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Check In
              </button>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Checked In at</p>
                  <p className="text-2xl font-bold text-gray-900">{checkInTime}</p>
                </div>
                <button
                  onClick={handleCheckOut}
                  className="px-8 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Check Out
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Attendance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentWeek.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.day}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.checkIn || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.checkOut || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusVariant(day.status || 'Absent')}>
                      {day.status || 'Absent'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default EmployeeAttendance;

