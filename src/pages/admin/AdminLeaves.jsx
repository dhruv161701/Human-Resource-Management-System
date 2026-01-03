import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import api from '../../services/api';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await api.getAllLeaves(statusFilter || null, 100);
      setLeaves(response.leaves || []);
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    }
    setLoading(false);
  };

  const handleApprove = (leave) => {
    setSelectedLeave(leave);
    setActionType('approve');
    setIsModalOpen(true);
  };

  const handleReject = (leave) => {
    setSelectedLeave(leave);
    setActionType('reject');
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedLeave) return;
    
    setProcessing(true);
    try {
      await api.reviewLeave(selectedLeave.id, actionType, comment);
      fetchLeaves();
    } catch (err) {
      console.error('Failed to process leave:', err);
    }
    setProcessing(false);
    setIsModalOpen(false);
    setComment('');
    setSelectedLeave(null);
    setActionType(null);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Approved':
        return 'approved';
      case 'Rejected':
        return 'rejected';
      default:
        return 'pending';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Leave Approval</h1>
          <p className="mt-1 text-sm text-gray-500">Review and manage employee leave requests</p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaves.map((leave, index) => (
                  <tr key={leave.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {leave.employee_name || 'Employee'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.leave_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {leave.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(leave.status)}>
                        {leave.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.reviewed_by_name || leave.reviewed_by || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {leave.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(leave)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {leave.status !== 'Pending' && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setComment('');
          setSelectedLeave(null);
          setActionType(null);
        }}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request`}
      >
        <div className="space-y-4">
          {selectedLeave && (
            <div className="text-sm text-gray-600">
              <p><strong>Employee:</strong> {selectedLeave.employee_name}</p>
              <p><strong>Leave Type:</strong> {selectedLeave.leave_type}</p>
              <p><strong>Date Range:</strong> {new Date(selectedLeave.start_date).toLocaleDateString()} - {new Date(selectedLeave.end_date).toLocaleDateString()}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason || '-'}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Add a comment..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setComment('');
                setSelectedLeave(null);
                setActionType(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={processing}
              className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLeaves;

