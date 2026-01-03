import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import api from '../../services/api';

const ManagerLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await api.getAllLeaves(filter === 'All' ? null : filter);
      setLeaves(response.leaves || []);
    } catch (err) {
      setError('Failed to load leave requests');
      console.error(err);
    }
    setLoading(false);
  };

  const handleReview = (leave) => {
    setSelectedLeave(leave);
    setComment('');
    setShowModal(true);
  };

  const handleAction = async (action) => {
    if (!selectedLeave) return;
    
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await api.reviewLeave(selectedLeave.id, action, comment);
      setSuccess(`Leave request ${action}d successfully`);
      setShowModal(false);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="present">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="absent">Rejected</Badge>;
      case 'Pending':
        return <Badge variant="half-day">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type) => {
    switch (type) {
      case 'Paid Leave':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{type}</span>;
      case 'Sick Leave':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">{type}</span>;
      case 'Unpaid Leave':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{type}</span>;
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{type}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <p className="mt-1 text-sm text-gray-500">Review and manage employee leave requests</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{success}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Leaves List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2">No {filter !== 'All' ? filter.toLowerCase() : ''} leave requests found</p>
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
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
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
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{leave.employee_name}</p>
                        <p className="text-sm text-gray-500">{leave.employee_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLeaveTypeBadge(leave.leave_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {calculateDays(leave.start_date, leave.end_date)} day(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleReview(leave)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {leave.status === 'Pending' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      {showModal && selectedLeave && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedLeave(null);
          }}
          title="Leave Request Details"
        >
          <div className="space-y-4">
            {/* Employee Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium">{selectedLeave.employee_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-medium">{selectedLeave.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <p className="font-medium">{selectedLeave.leave_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">
                    {calculateDays(selectedLeave.start_date, selectedLeave.end_date)} day(s)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(selectedLeave.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(selectedLeave.end_date)}</p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Reason</p>
              <p className="p-3 bg-gray-50 rounded-lg text-sm">
                {selectedLeave.reason || 'No reason provided'}
              </p>
            </div>

            {/* Comment Input or Display */}
            {selectedLeave.status === 'Pending' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any comments..."
                />
              </div>
            ) : (
              selectedLeave.comment && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Manager Comment</p>
                  <p className="p-3 bg-gray-50 rounded-lg text-sm">{selectedLeave.comment}</p>
                </div>
              )
            )}

            {/* Action Buttons */}
            {selectedLeave.status === 'Pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManagerLeaves;
