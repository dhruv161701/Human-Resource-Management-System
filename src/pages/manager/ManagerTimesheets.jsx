import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import api from '../../services/api';

const ManagerTimesheets = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchTimesheets();
  }, [filter]);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      let response;
      if (filter === 'pending') {
        response = await api.getPendingTimesheets();
      } else {
        response = await api.getAllTimesheets(filter === 'all' ? null : filter);
      }
      setTimesheets(response.timesheets || []);
    } catch (err) {
      setError('Failed to load timesheets');
      console.error(err);
    }
    setLoading(false);
  };

  const handleReview = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setComments('');
    setShowModal(true);
  };

  const handleAction = async (action) => {
    if (!selectedTimesheet) return;
    
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await api.reviewTimesheet(
        selectedTimesheet.employee_id,
        selectedTimesheet.week_start,
        action,
        comments
      );
      setSuccess(`Timesheet ${action}d successfully`);
      setShowModal(false);
      setSelectedTimesheet(null);
      fetchTimesheets();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="present">Approved</Badge>;
      case 'rejected':
        return <Badge variant="absent">Rejected</Badge>;
      case 'pending':
        return <Badge variant="half-day">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Timesheet Management</h1>
        <p className="mt-1 text-sm text-gray-500">Review and approve employee timesheets</p>
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
          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
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

      {/* Timesheets List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : timesheets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2">No {filter !== 'all' ? filter : ''} timesheets found</p>
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
                    Week Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
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
                {timesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{timesheet.employee_name}</p>
                        <p className="text-sm text-gray-500">{timesheet.employee_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(timesheet.week_start)} - {formatDate(timesheet.week_end)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{timesheet.total_hours}h</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(timesheet.submitted_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(timesheet.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleReview(timesheet)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {timesheet.status === 'pending' ? 'Review' : 'View Details'}
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
      {showModal && selectedTimesheet && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedTimesheet(null);
          }}
          title="Review Timesheet"
        >
          <div className="space-y-4">
            {/* Employee Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium">{selectedTimesheet.employee_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-medium">{selectedTimesheet.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Week Period</p>
                  <p className="font-medium">
                    {formatDate(selectedTimesheet.week_start)} - {formatDate(selectedTimesheet.week_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="font-medium text-blue-600">{selectedTimesheet.total_hours}h</p>
                </div>
              </div>
            </div>

            {/* Attendance Records */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Attendance</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Check-In</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Check-Out</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTimesheet.attendance_records?.map((record, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{formatDate(record.date)}</td>
                        <td className="px-4 py-2 text-sm">{record.check_in || '-'}</td>
                        <td className="px-4 py-2 text-sm">{record.check_out || '-'}</td>
                        <td className="px-4 py-2 text-sm font-medium">{record.total_hours || 0}h</td>
                        <td className="px-4 py-2">
                          <Badge variant={record.status?.toLowerCase() === 'present' ? 'present' : 'absent'}>
                            {record.status || 'Absent'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comments */}
            {selectedTimesheet.status === 'pending' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any comments for the employee..."
                />
              </div>
            ) : (
              selectedTimesheet.comments && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Manager Comments</p>
                  <p className="mt-1">{selectedTimesheet.comments}</p>
                </div>
              )
            )}

            {/* Action Buttons */}
            {selectedTimesheet.status === 'pending' && (
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

export default ManagerTimesheets;
