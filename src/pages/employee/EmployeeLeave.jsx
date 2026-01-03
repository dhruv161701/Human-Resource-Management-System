import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import api from '../../services/api';

const EmployeeLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    leaveType: 'Paid Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await api.getMyLeaves();
      setLeaves(response.leaves || []);
    } catch (err) {
      setError('Failed to load leave requests');
      console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.applyLeave({
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason
      });
      setSuccess('Leave request submitted successfully!');
      setFormData({ leaveType: 'Paid Leave', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const handleCancel = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.cancelLeave(leaveId);
      setSuccess('Leave request cancelled successfully');
      fetchLeaves();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Approved':
        return 'present';
      case 'Rejected':
        return 'absent';
      default:
        return 'half-day';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
        <p className="mt-1 text-sm text-gray-500">Apply for leave and track your requests</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply for Leave</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="Paid Leave">Paid Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                min={getMinDate()}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                min={formData.startDate || getMinDate()}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter reason for leave"
                required
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Leave Requests</h2>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2">No leave requests yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {leaves.map((leave) => (
                <div key={leave.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          leave.leave_type === 'Paid Leave' ? 'bg-green-100 text-green-800' :
                          leave.leave_type === 'Sick Leave' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {leave.leave_type}
                        </span>
                        <Badge variant={getStatusVariant(leave.status)}>
                          {leave.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">
                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {leave.reason}
                      </p>
                      {leave.comment && (
                        <p className="text-sm text-blue-600 mt-2">
                          <span className="font-medium">Comment:</span> {leave.comment}
                        </p>
                      )}
                    </div>
                    {leave.status === 'Pending' && (
                      <button
                        onClick={() => handleCancel(leave.id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmployeeLeave;

