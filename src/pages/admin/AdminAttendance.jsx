import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import api from '../../services/api';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedEmployee, selectedDate]);

  const fetchEmployees = async () => {
    try {
      const response = await api.getAllEmployees();
      setEmployees(response.employees || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.getAllAttendance(selectedDate, selectedEmployee || null, 100);
      setAttendance(response.attendance || []);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
    setLoading(false);
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage employee attendance</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.name || emp.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAttendance}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No attendance records found for this date
                    </td>
                  </tr>
                ) : (
                  attendance.map((att, index) => (
                    <tr key={att.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {att.employee_name || att.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(att.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {att.check_in || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {att.check_out || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {att.total_hours ? `${att.total_hours}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusVariant(att.status)}>
                          {att.status || 'Unknown'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAttendance;

