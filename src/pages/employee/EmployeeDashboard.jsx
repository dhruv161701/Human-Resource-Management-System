import Card from '../../components/Card';
import { getCurrentEmployee, getEmployeeAttendance, getEmployeeLeaves } from '../../data/mockData';

const EmployeeDashboard = () => {
  const employee = getCurrentEmployee();
  const attendance = getEmployeeAttendance(employee.id);
  const leaves = getEmployeeLeaves(employee.id);

  const todayAttendance = attendance.find(
    (att) => att.date === new Date().toISOString().split('T')[0]
  );

  const totalLeaves = leaves.filter((l) => l.status === 'Approved').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;

  const stats = [
    {
      title: "Today's Attendance Status",
      value: todayAttendance?.status || 'Not Checked In',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: todayAttendance?.status === 'Present' ? 'text-green-600' : 'text-gray-600',
    },
    {
      title: 'Total Leaves Taken',
      value: totalLeaves,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'text-blue-600',
    },
    {
      title: 'Pending Leave Requests',
      value: pendingLeaves,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'text-yellow-600',
    },
    {
      title: 'Recent Activity',
      value: attendance.length,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back, {employee.name}!</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attendance</h2>
          <div className="space-y-3">
            {attendance.slice(0, 5).map((att) => (
              <div key={att.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{new Date(att.date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">
                    {att.checkIn ? `${att.checkIn} - ${att.checkOut || 'Not checked out'}` : 'No record'}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    att.status === 'Present'
                      ? 'bg-green-100 text-green-800'
                      : att.status === 'Absent'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {att.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Leave Requests</h2>
          <div className="space-y-3">
            {leaves.slice(0, 5).map((leave) => (
              <div key={leave.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{leave.leaveType}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
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
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

