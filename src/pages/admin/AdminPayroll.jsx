import { useState } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { mockEmployees, getAllPayroll, updatePayroll, processPayrollForMonth, payrollConfig } from '../../data/mockData';

const AdminPayroll = () => {
  const [payrollData, setPayrollData] = useState(getAllPayroll());
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [showNotificationPreview, setShowNotificationPreview] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleEdit = (payroll) => {
    setEditingPayroll({ ...payroll });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingPayroll) {
      const deductions = editingPayroll.unpaidLeaves * payrollConfig.deductionPerUnpaidLeave;
      const netSalary = editingPayroll.baseSalary + editingPayroll.allowances - deductions;
      
      updatePayroll(editingPayroll.employeeId, {
        baseSalary: editingPayroll.baseSalary,
        allowances: editingPayroll.allowances,
        unpaidLeaves: editingPayroll.unpaidLeaves,
        deductions,
        netSalary,
      });
      
      setPayrollData(getAllPayroll());
      setIsEditModalOpen(false);
      setEditingPayroll(null);
    }
  };

  const handleProcessPayroll = () => {
    processPayrollForMonth();
    setPayrollData(getAllPayroll());
    setIsProcessModalOpen(false);
    setShowNotificationPreview(true);
  };

  const getEmployeeName = (employeeId) => {
    const employee = mockEmployees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  const getStatusVariant = (status) => {
    return status === 'Credited' ? 'approved' : 'pending';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage employee payroll and process salary</p>
        </div>
        <button
          onClick={() => setIsProcessModalOpen(true)}
          disabled={payrollData.some(p => p.status === 'Credited')}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Process Payroll for Month
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unpaid Leaves
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollData.map((payroll) => (
                <tr key={payroll.employeeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getEmployeeName(payroll.employeeId)}
                    </div>
                    <div className="text-xs text-gray-500">{payroll.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payroll.baseSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {formatCurrency(payroll.allowances)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payroll.unpaidLeaves} day(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {formatCurrency(payroll.deductions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(payroll.netSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusVariant(payroll.status)}>
                      {payroll.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(payroll)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPayroll(null);
        }}
        title={`Edit Payroll - ${editingPayroll ? getEmployeeName(editingPayroll.employeeId) : ''}`}
      >
        {editingPayroll && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Salary</label>
              <input
                type="number"
                value={editingPayroll.baseSalary}
                onChange={(e) => setEditingPayroll({ ...editingPayroll, baseSalary: parseInt(e.target.value) || 0 })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allowances</label>
              <input
                type="number"
                value={editingPayroll.allowances}
                onChange={(e) => setEditingPayroll({ ...editingPayroll, allowances: parseInt(e.target.value) || 0 })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unpaid Leaves</label>
              <input
                type="number"
                value={editingPayroll.unpaidLeaves}
                onChange={(e) => setEditingPayroll({ ...editingPayroll, unpaidLeaves: parseInt(e.target.value) || 0 })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Deduction per unpaid leave: {formatCurrency(payrollConfig.deductionPerUnpaidLeave)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Net Salary:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(
                    editingPayroll.baseSalary +
                    editingPayroll.allowances -
                    (editingPayroll.unpaidLeaves * payrollConfig.deductionPerUnpaidLeave)
                  )}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPayroll(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Process Payroll Modal */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Process Payroll"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to process payroll for all employees for this month? This will mark all salaries as "Credited" and send notifications.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-xs text-yellow-800">
              This action will process payroll for {payrollData.length} employee(s).
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsProcessModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayroll}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Process Payroll
            </button>
          </div>
        </div>
      </Modal>

      {/* Salary Notification Preview */}
      <Modal
        isOpen={showNotificationPreview}
        onClose={() => setShowNotificationPreview(false)}
        title="Salary Processed Successfully"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800 font-medium">
              Salary successfully processed and notification sent.
            </p>
          </div>

          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Email Notification Preview</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">To:</span>
                <span className="ml-2 text-gray-600">All Employees</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Subject:</span>
                <span className="ml-2 text-gray-600">Salary Credited - {payrollData[0]?.month}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-700">Body:</span>
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-gray-700 text-xs whitespace-pre-line">
                  Dear Employee,

                  Your salary for {payrollData[0]?.month} has been processed and credited to your account.

                  Please check your payroll details in the Dayflow HRMS portal.

                  If you have any queries, please contact HR.

                  Best regards,
                  HR Team
                  Dayflow
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowNotificationPreview(false)}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPayroll;

