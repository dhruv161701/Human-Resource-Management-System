import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { getCurrentEmployee, getEmployeePayroll, calculateAISalary } from '../../data/mockData';

const EmployeePayroll = () => {
  const employee = getCurrentEmployee();
  const payroll = getEmployeePayroll(employee.id);
  const [aiSalary, setAiSalary] = useState(null);

  useEffect(() => {
    // Calculate AI salary for current month
    const currentDate = new Date();
    const calculated = calculateAISalary(employee.id, currentDate.getFullYear(), currentDate.getMonth());
    setAiSalary(calculated);
  }, [employee.id]);

  if (!payroll) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">View your salary details</p>
        </div>
        <Card>
          <p className="text-gray-500 text-center py-8">No payroll information available</p>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
        <p className="mt-1 text-sm text-gray-500">View your salary details</p>
      </div>

      {/* AI-Generated Salary Explanation */}
      {aiSalary && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">AI-Generated Salary Explanation</h2>
              <Badge variant="info">AI-Powered</Badge>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-base text-gray-800 leading-relaxed">{aiSalary.explanation}</p>
            </div>
            {aiSalary.policyWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Policy Alert:</strong> {aiSalary.policyWarning}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Payroll shown is system-generated and subject to HR approval.
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{payroll.month}</h2>
              <p className="text-sm text-gray-500 mt-1">Payroll Statement</p>
            </div>
            <Badge variant={payroll.status === 'Credited' ? 'approved' : 'pending'}>
              {payroll.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Base Salary</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(payroll.baseSalary)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Allowances</span>
                  <span className="text-sm font-medium text-green-600">+ {formatCurrency(payroll.allowances)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Gross Salary</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(payroll.baseSalary + payroll.allowances)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Deductions</h3>
              
              <div className="space-y-3">
                {payroll.unpaidLeaves > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-600">Unpaid Leaves</span>
                        <span className="ml-2 text-xs text-gray-500">({payroll.unpaidLeaves} day(s))</span>
                      </div>
                      <span className="text-sm font-medium text-red-600">- {formatCurrency(payroll.deductions)}</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-xs text-red-800">
                        Salary deduction applicable for {payroll.unpaidLeaves} unpaid leave day(s)
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">No deductions</span>
                    <span className="text-sm font-medium text-gray-400">- {formatCurrency(0)}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total Deductions</span>
                  <span className="text-base font-bold text-red-600">
                    {formatCurrency(payroll.deductions)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* WFH/On-Site Stats */}
          {aiSalary && aiSalary.stats.totalDays > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">On-Site Days</p>
                  <p className="text-2xl font-bold text-gray-900">{aiSalary.stats.onsiteDays}</p>
                  <p className="text-xs text-gray-500 mt-1">{aiSalary.stats.onsitePercentage.toFixed(1)}% of total</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">WFH Days</p>
                  <p className="text-2xl font-bold text-gray-900">{aiSalary.stats.wfhDays}</p>
                  <p className="text-xs text-gray-500 mt-1">{aiSalary.stats.wfhPercentage.toFixed(1)}% of total</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Working Days</p>
                  <p className="text-2xl font-bold text-gray-900">{aiSalary.stats.totalDays}</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xl font-semibold text-gray-900">Net Salary (Estimated)</span>
                <p className="text-sm text-gray-500 mt-1">Amount after deductions</p>
              </div>
              <span className="text-3xl font-bold text-blue-600">
                {formatCurrency(payroll.netSalary)}
              </span>
            </div>
          </div>

          {payroll.status === 'Pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Status:</strong> Your salary is pending processing. It will be credited after HR approval.
              </p>
            </div>
          )}

          {payroll.status === 'Credited' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                <strong>Status:</strong> Salary has been credited to your account.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EmployeePayroll;
