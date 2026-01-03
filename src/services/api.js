const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.includeAuth !== false),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401 && data.code === 'token_expired') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          window.location.href = '/login';
        }
        throw new Error(data.error || 'An error occurred');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async signup(data) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: false,
    });
  }

  async verifyOtp(email, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
      includeAuth: false,
    });
  }

  async resendOtp(email) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
      includeAuth: false,
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    });
  }

  async managerLogin(email, password) {
    return this.request('/auth/manager/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Employee endpoints
  async getProfile() {
    return this.request('/employee/profile');
  }

  async updateProfile(data) {
    return this.request('/employee/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/employee/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  async uploadDocument(file, documentType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/employee/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  async deleteDocument(docIndex) {
    return this.request(`/employee/documents/${docIndex}`, {
      method: 'DELETE',
    });
  }

  async getSalary() {
    return this.request('/employee/salary');
  }

  // Attendance endpoints
  async checkIn(date = null) {
    return this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  }

  async checkOut(date = null) {
    return this.request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  }

  async getTodayAttendance() {
    return this.request('/attendance/today');
  }

  async getWeeklyAttendance() {
    return this.request('/attendance/weekly');
  }

  async getAttendanceHistory(startDate, endDate, limit = 30) {
    let url = `/attendance/history?limit=${limit}`;
    if (startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }
    return this.request(url);
  }

  async getManagers() {
    return this.request('/attendance/managers');
  }

  async canSubmitTimesheet() {
    return this.request('/attendance/can-submit-timesheet');
  }

  // Timesheet endpoints
  async submitTimesheet(managerId) {
    return this.request('/timesheet/submit', {
      method: 'POST',
      body: JSON.stringify({ manager_id: managerId }),
    });
  }

  async getTimesheetStatus() {
    return this.request('/timesheet/status');
  }

  async getTimesheetHistory(limit = 10) {
    return this.request(`/timesheet/history?limit=${limit}`);
  }

  // Manager timesheet endpoints
  async getPendingTimesheets() {
    return this.request('/timesheet/manager/pending');
  }

  async getAllTimesheets(status = null, limit = 50) {
    let url = `/timesheet/manager/all?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.request(url);
  }

  async reviewTimesheet(employeeId, weekStart, action, comments = '') {
    return this.request('/timesheet/manager/review', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: employeeId,
        week_start: weekStart,
        action,
        comments,
      }),
    });
  }

  // Leave endpoints
  async applyLeave(data) {
    return this.request('/leave/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyLeaves(status = null, limit = 20) {
    let url = `/leave/my-leaves?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.request(url);
  }

  async cancelLeave(leaveId) {
    return this.request(`/leave/cancel/${leaveId}`, {
      method: 'DELETE',
    });
  }

  // Admin leave endpoints
  async getAllLeaves(status = null, limit = 50) {
    let url = `/leave/admin/all?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.request(url);
  }

  async getPendingLeaves() {
    return this.request('/leave/admin/pending');
  }

  async reviewLeave(leaveId, action, comment = '') {
    return this.request('/leave/admin/review', {
      method: 'POST',
      body: JSON.stringify({
        leave_id: leaveId,
        action,
        comment,
      }),
    });
  }

  // Admin endpoints
  async getAllEmployees(search = '', department = '', limit = 100) {
    let url = `/admin/employees?limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (department) {
      url += `&department=${encodeURIComponent(department)}`;
    }
    return this.request(url);
  }

  async getEmployee(employeeId) {
    return this.request(`/admin/employees/${employeeId}`);
  }

  async updateEmployee(employeeId, data) {
    return this.request(`/admin/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateEmployeeSalary(employeeId, salaryData) {
    return this.request(`/admin/employees/${employeeId}/salary`, {
      method: 'PUT',
      body: JSON.stringify(salaryData),
    });
  }

  async getAllAttendance(date = null, employeeId = null, limit = 100) {
    let url = `/admin/attendance/all?limit=${limit}`;
    if (date) {
      url += `&date=${date}`;
    }
    if (employeeId) {
      url += `&employee_id=${employeeId}`;
    }
    return this.request(url);
  }

  async getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getDepartments() {
    return this.request('/admin/departments');
  }

  // Health check
  async healthCheck() {
    return this.request('/health', { includeAuth: false });
  }

  // Document Request endpoints
  async getDocumentTypes() {
    return this.request('/documents/types');
  }

  async getPendingDocumentRequests() {
    return this.request('/documents/requests/pending');
  }

  async getAllDocumentRequests(status = null) {
    let url = '/documents/requests/all';
    if (status) {
      url += `?status=${status}`;
    }
    return this.request(url);
  }

  async uploadRequestedDocument(requestId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/documents/upload/${requestId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  // Admin document request endpoints
  async requestDocument(employeeId, documentType, description, dueDate) {
    return this.request('/documents/request', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: employeeId,
        document_type: documentType,
        description,
        due_date: dueDate
      }),
    });
  }

  async getAdminDocumentRequests(status = null, employeeId = null, limit = 50) {
    let url = `/documents/admin/requests?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    if (employeeId) {
      url += `&employee_id=${employeeId}`;
    }
    return this.request(url);
  }

  async getUploadedDocuments(employeeId) {
    return this.request(`/documents/admin/employee/${employeeId}`);
  }

  async reviewDocument(requestId, action, comments = '') {
    return this.request('/documents/admin/review', {
      method: 'POST',
      body: JSON.stringify({
        request_id: requestId,
        action,
        comments
      }),
    });
  }

  // Payroll endpoints
  async getPayslips(limit = 12) {
    return this.request(`/payroll/my-payslips?limit=${limit}`);
  }

  async getPayrollEmployees(search = '') {
    let url = '/payroll/admin/employees';
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    return this.request(url);
  }

  async generatePayslip(employeeId, monthYear) {
    return this.request('/payroll/admin/generate-payslip', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: employeeId,
        month_year: monthYear
      }),
    });
  }

  async getAllPayslips(employeeId = null, monthYear = null, status = null, limit = 100) {
    let url = `/payroll/admin/payslips?limit=${limit}`;
    if (employeeId) url += `&employee_id=${employeeId}`;
    if (monthYear) url += `&month_year=${monthYear}`;
    if (status) url += `&status=${status}`;
    return this.request(url);
  }

  async markPayslipPaid(payslipId) {
    return this.request(`/payroll/admin/payslip/${payslipId}/mark-paid`, {
      method: 'POST',
    });
  }

  // AI endpoints
  async aiChat(message) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async generateAIInsights(type = 'general') {
    return this.request('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async getQuickInsights() {
    return this.request('/ai/quick-insights');
  }
}

export const api = new ApiService();
export default api;
