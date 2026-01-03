// Mock data for the HRMS application

export const mockEmployees = [
  {
    id: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    department: 'Engineering',
    role: 'Software Engineer',
    phone: '+1 234-567-8900',
    address: '123 Main St, City, State 12345',
    status: 'Active',
    profilePicture: null,
  },
  {
    id: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    department: 'HR',
    role: 'HR Manager',
    phone: '+1 234-567-8901',
    address: '456 Oak Ave, City, State 12345',
    status: 'Active',
    profilePicture: null,
  },
  {
    id: 'EMP003',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    department: 'Marketing',
    role: 'Marketing Specialist',
    phone: '+1 234-567-8902',
    address: '789 Pine Rd, City, State 12345',
    status: 'Active',
    profilePicture: null,
  },
];

export const mockAttendance = [
  {
    id: 'ATT001',
    employeeId: 'EMP001',
    date: '2024-01-01',
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    status: 'Present',
  },
  {
    id: 'ATT002',
    employeeId: 'EMP001',
    date: '2024-01-02',
    checkIn: '09:15 AM',
    checkOut: '05:45 PM',
    status: 'Present',
  },
  {
    id: 'ATT003',
    employeeId: 'EMP001',
    date: '2024-01-03',
    checkIn: null,
    checkOut: null,
    status: 'Absent',
  },
  {
    id: 'ATT004',
    employeeId: 'EMP001',
    date: '2024-01-04',
    checkIn: '09:00 AM',
    checkOut: '01:00 PM',
    status: 'Half-day',
  },
  {
    id: 'ATT005',
    employeeId: 'EMP001',
    date: '2024-01-05',
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    status: 'Present',
  },
];

export const mockLeaves = [
  {
    id: 'LEV001',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    leaveType: 'Sick Leave',
    startDate: '2024-01-10',
    endDate: '2024-01-12',
    reason: 'Medical appointment',
    status: 'Pending',
    comment: null,
  },
  {
    id: 'LEV002',
    employeeId: 'EMP002',
    employeeName: 'Jane Smith',
    leaveType: 'Paid Leave',
    startDate: '2024-01-15',
    endDate: '2024-01-17',
    reason: 'Family vacation',
    status: 'Approved',
    comment: 'Approved',
  },
  {
    id: 'LEV003',
    employeeId: 'EMP003',
    employeeName: 'Mike Johnson',
    leaveType: 'Unpaid Leave',
    startDate: '2024-01-20',
    endDate: '2024-01-22',
    reason: 'Personal reasons',
    status: 'Pending',
    comment: null,
  },
];

// Current user (will be set after login)
export const getCurrentEmployee = () => {
  return mockEmployees[0]; // Default to first employee
};

export const getEmployeeAttendance = (employeeId) => {
  return mockAttendance.filter(att => att.employeeId === employeeId);
};

export const getEmployeeLeaves = (employeeId) => {
  return mockLeaves.filter(leave => leave.employeeId === employeeId);
};

