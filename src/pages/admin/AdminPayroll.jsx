import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import api from '../../services/api';

const AdminPayroll = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [salaryData, setSalaryData] = useState({ basic: 0, hra: 0, allowances: 0, deductions: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [payslipMonth, setPayslipMonth] = useState('');
  const [generatingPayslip, setGeneratingPayslip] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.getPayrollEmployees(searchTerm);
      setEmployees(response.employees || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
    setLoading(false);
  };

  const handleEditSalary = (employee) => {
    setSelectedEmployee(employee);
    setSalaryData({
      basic: employee.salary?.basic || 0,
      hra: employee.salary?.hra || 0,
      allowances: employee.salary?.allowances || 0,
      deductions: employee.salary?.deductions || 0
    });
    setShowSalaryModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleSaveSalary = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.updateEmployeeSalary(selectedEmployee.employee_id, salaryData);
      setMessage({ type: 'success', text: 'Salary updated successfully' });
      fetchEmployees();
      setTimeout(() => {
        setShowSalaryModal(false);
        setMessage({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update salary' });
    }
    setSaving(false);
  };

  const handleGeneratePayslip = (employee) => {
    setSelectedEmployee(employee);
    const now = new Date();
    setPayslipMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    setShowPayslipModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleConfirmGeneratePayslip = async () => {
    if (!payslipMonth) {
      setMessage({ type: 'error', text: 'Please select a month' });
      return;
    }
    setGeneratingPayslip(true);
    setMessage({ type: '', text: '' });
    try {
      await api.generatePayslip(selectedEmployee.employee_id, payslipMonth);
      setMessage({ type: 'success', text: 'Payslip generated successfully' });
      fetchEmployees();
      setTimeout(() => {
        setShowPayslipModal(false);
        setMessage({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to generate payslip' });
    }
    setGeneratingPayslip(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const calculateNetSalary = () => {
    return salaryData.basic + salaryData.hra + salaryData.allowances - salaryData.deductions;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage employee salaries and generate payslips</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="p-2">
            <p className="text-blue-100 text-sm">Total Employees</p>
            <p className="text-3xl font-bold mt-1">{employees.length}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="p-2">
            <p className="text-green-100 text-sm">Salary Configured</p>
            <p className="text-3xl font-bold mt-1">
              {employees.filter(e => e.salary?.net > 0).length}
            </p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="p-2">
            <p className="text-yellow-100 text-sm">Pending Configuration</p>
            <p className="text-3xl font-bold mt-1">
              {employees.filter(e => !e.salary?.net).length}
            </p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="p-2">
            <p className="text-purple-100 text-sm">Total Monthly Payroll</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(employees.reduce((sum, e) => sum + (e.salary?.net || 0), 0))}
            </p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search employees by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Employee Payroll Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HRA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.employee_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {(employee.name || employee.email || 'E').charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{employee.name || 'Not Set'}</p>
                          <p className="text-xs text-gray-500">{employee.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.department || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(employee.salary?.basic)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(employee.salary?.hra)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(employee.salary?.allowances)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(employee.salary?.deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.salary?.net ? (
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(employee.salary.net)}
                        </span>
                      ) : (
                        <Badge variant="default">Not Set</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEditSalary(employee)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit Salary
                      </button>
                      {employee.salary?.net > 0 && (
                        <button
                          onClick={() => handleGeneratePayslip(employee)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Generate Payslip
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Salary Modal */}
      <Modal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        title={`Edit Salary - ${selectedEmployee?.name || selectedEmployee?.employee_id}`}
      >
        <div className="space-y-4">
          {message.text && (
            <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (₹)</label>
              <input
                type="number"
                value={salaryData.basic}
                onChange={(e) => setSalaryData({ ...salaryData, basic: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HRA (₹)</label>
              <input
                type="number"
                value={salaryData.hra}
                onChange={(e) => setSalaryData({ ...salaryData, hra: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowances (₹)</label>
              <input
                type="number"
                value={salaryData.allowances}
                onChange={(e) => setSalaryData({ ...salaryData, allowances: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (₹)</label>
              <input
                type="number"
                value={salaryData.deductions}
                onChange={(e) => setSalaryData({ ...salaryData, deductions: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-800">Net Salary (Monthly)</span>
              <span className="text-2xl font-bold text-green-700">{formatCurrency(calculateNetSalary())}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowSalaryModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSalary}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Salary'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Generate Payslip Modal */}
      <Modal
        isOpen={showPayslipModal}
        onClose={() => setShowPayslipModal(false)}
        title={`Generate Payslip - ${selectedEmployee?.name || selectedEmployee?.employee_id}`}
      >
        <div className="space-y-4">
          {message.text && (
            <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
            <input
              type="month"
              value={payslipMonth}
              onChange={(e) => setPayslipMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {selectedEmployee?.salary && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-700 mb-2">Payslip Preview</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Basic Salary</span>
                <span>{formatCurrency(selectedEmployee.salary.basic)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">HRA</span>
                <span>{formatCurrency(selectedEmployee.salary.hra)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Allowances</span>
                <span>{formatCurrency(selectedEmployee.salary.allowances)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Deductions</span>
                <span>- {formatCurrency(selectedEmployee.salary.deductions)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                <span className="text-green-700">Net Salary</span>
                <span className="text-green-700">{formatCurrency(selectedEmployee.salary.net)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowPayslipModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmGeneratePayslip}
              disabled={generatingPayslip}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {generatingPayslip ? 'Generating...' : 'Generate Payslip'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPayroll;
