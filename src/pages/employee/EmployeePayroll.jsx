import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import api from '../../services/api';

const EmployeePayroll = () => {
  const [salary, setSalary] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const [salaryData, payslipsData] = await Promise.all([
        api.getProfile(),
        api.getPayslips()
      ]);
      setSalary(salaryData.salary || null);
      setPayslips(payslipsData.payslips || []);
    } catch (err) {
      setError('Failed to load payroll data');
      console.error(err);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getMonthName = (monthYear) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
        <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
        <p className="mt-1 text-sm text-gray-500">View your salary structure and payslips</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Salary Structure Card */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Salary Structure</h2>
          {salary && (
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          )}
        </div>

        {salary && (salary.basic || salary.hra || salary.net) ? (
          <div className="space-y-6">
            {/* Earnings */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Earnings</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 md:border-0">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(salary.basic)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 md:border-0">
                    <span className="text-gray-600">HRA</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(salary.hra)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Allowances</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(salary.allowances)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium text-gray-700">Gross Salary</span>
                  <span className="font-bold text-lg text-gray-900">
                    {formatCurrency((salary.basic || 0) + (salary.hra || 0) + (salary.allowances || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Deductions</h3>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-red-700">Total Deductions</span>
                  <span className="font-semibold text-red-700">- {formatCurrency(salary.deductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-100 text-sm">Net Salary (Monthly)</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(salary.net)}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm">Annual CTC</p>
                  <p className="text-xl font-semibold mt-1">{formatCurrency((salary.net || 0) * 12)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Salary Not Configured</h3>
            <p className="mt-2 text-gray-500">Your salary structure has not been set up yet. Please contact HR.</p>
          </div>
        )}
      </Card>

      {/* Payslips History */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Payslip History</h2>
        
        {payslips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getMonthName(payslip.month_year)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payslip.gross_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      - {formatCurrency(payslip.deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(payslip.net_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payslip.status === 'Paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payslip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedPayslip(payslip)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Payslips Yet</h3>
            <p className="mt-2 text-gray-500">Your payslip history will appear here once generated.</p>
          </div>
        )}
      </Card>

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Payslip - {getMonthName(selectedPayslip.month_year)}
                </h3>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.basic)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">HRA</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.hra)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowances</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.allowances)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium">Gross Salary</span>
                      <span className="font-bold">{formatCurrency(selectedPayslip.gross_salary)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-700 mb-3">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-red-600">Total Deductions</span>
                      <span className="font-medium text-red-600">- {formatCurrency(selectedPayslip.deductions)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800">Net Salary</span>
                    <span className="text-2xl font-bold text-green-700">{formatCurrency(selectedPayslip.net_salary)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 pt-4">
                  <span>Payment Status: <span className={`font-medium ${selectedPayslip.status === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedPayslip.status}</span></span>
                  {selectedPayslip.paid_on && <span>Paid on: {new Date(selectedPayslip.paid_on).toLocaleDateString()}</span>}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePayroll;
