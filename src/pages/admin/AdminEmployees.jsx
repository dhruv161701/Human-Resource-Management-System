import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import api from '../../services/api';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [salaryEditMode, setSalaryEditMode] = useState(false);
  const [salaryData, setSalaryData] = useState({ basic: 0, hra: 0, allowances: 0, deductions: 0 });
  const [showDocRequestModal, setShowDocRequestModal] = useState(false);
  const [docRequestData, setDocRequestData] = useState({ document_type: '', description: '', due_date: '' });
  const [docRequestLoading, setDocRequestLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.getAllEmployees(searchTerm);
      setEmployees(response.employees || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleViewEmployee = async (employeeId) => {
    try {
      const employee = await api.getEmployee(employeeId);
      setSelectedEmployee(employee);
      setEditData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        job_title: employee.job_title || '',
        address: employee.address || ''
      });
      setSalaryData({
        basic: employee.salary?.basic || 0,
        hra: employee.salary?.hra || 0,
        allowances: employee.salary?.allowances || 0,
        deductions: employee.salary?.deductions || 0
      });
      // Fetch uploaded documents for review
      try {
        const docsResponse = await api.getUploadedDocuments(employeeId);
        setUploadedDocs(docsResponse.documents || []);
      } catch {
        setUploadedDocs([]);
      }
      setShowModal(true);
      setEditMode(false);
      setSalaryEditMode(false);
      setMessage({ type: '', text: '' });
    } catch (err) {
      console.error('Failed to fetch employee:', err);
    }
  };

  const handleApproveDocument = async (docId) => {
    try {
      await api.reviewDocument(docId, 'approved');
      setMessage({ type: 'success', text: 'Document approved successfully' });
      // Refresh data
      const docsResponse = await api.getUploadedDocuments(selectedEmployee.employee_id);
      setUploadedDocs(docsResponse.documents || []);
      const updated = await api.getEmployee(selectedEmployee.employee_id);
      setSelectedEmployee(updated);
      fetchEmployees();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve document' });
    }
  };

  const handleRejectDocument = async (docId) => {
    if (!rejectReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for rejection' });
      return;
    }
    try {
      await api.reviewDocument(docId, 'rejected', rejectReason);
      setMessage({ type: 'success', text: 'Document rejected. Employee will be notified to re-upload.' });
      setReviewingDoc(null);
      setRejectReason('');
      // Refresh data
      const docsResponse = await api.getUploadedDocuments(selectedEmployee.employee_id);
      setUploadedDocs(docsResponse.documents || []);
      const updated = await api.getEmployee(selectedEmployee.employee_id);
      setSelectedEmployee(updated);
      fetchEmployees();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to reject document' });
    }
  };

  const handleSaveEmployee = async () => {
    setSaving(true);
    try {
      await api.updateEmployee(selectedEmployee.employee_id, editData);
      setEditMode(false);
      fetchEmployees();
      // Refresh employee data
      const updated = await api.getEmployee(selectedEmployee.employee_id);
      setSelectedEmployee(updated);
    } catch (err) {
      console.error('Failed to update employee:', err);
    }
    setSaving(false);
  };

  const handleSaveSalary = async () => {
    setSaving(true);
    try {
      await api.updateEmployeeSalary(selectedEmployee.employee_id, salaryData);
      const updated = await api.getEmployee(selectedEmployee.employee_id);
      setSelectedEmployee(updated);
      setSalaryEditMode(false);
      setMessage({ type: 'success', text: 'Salary updated successfully!' });
    } catch (err) {
      console.error('Failed to update salary:', err);
      setMessage({ type: 'error', text: 'Failed to update salary' });
    }
    setSaving(false);
  };

  const handleRequestDocument = async () => {
    if (!docRequestData.document_type) {
      setMessage({ type: 'error', text: 'Please select a document type' });
      return;
    }
    
    setDocRequestLoading(true);
    try {
      await api.requestDocument(
        selectedEmployee.employee_id,
        docRequestData.document_type,
        docRequestData.description,
        docRequestData.due_date
      );
      setShowDocRequestModal(false);
      setDocRequestData({ document_type: '', description: '', due_date: '' });
      setMessage({ type: 'success', text: 'Document request sent successfully! Email notification sent to employee.' });
      // Refresh employee data
      const updated = await api.getEmployee(selectedEmployee.employee_id);
      setSelectedEmployee(updated);
    } catch (err) {
      console.error('Failed to request document:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to send document request' });
    }
    setDocRequestLoading(false);
  };

  const documentTypes = [
    'Aadhar Card',
    'PAN Card',
    'Passport',
    'Driving License',
    'Voter ID',
    '10th Marksheet',
    '12th Marksheet',
    'Graduation Certificate',
    'Post Graduation Certificate',
    'Experience Letter',
    'Relieving Letter',
    'Salary Slip',
    'Bank Statement',
    'Address Proof',
    'Photo',
    'Resume/CV',
    'Other'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and view all employees</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
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
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
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
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.employee_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
                          {(employee.name || employee.email || 'E').charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{employee.name || 'Not Set'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.employee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.department || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{employee.document_count || 0}</span>
                        {employee.pending_doc_requests > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            {employee.pending_doc_requests} pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={employee.is_verified ? 'success' : 'default'}>
                        {employee.is_verified ? 'Active' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewEmployee(employee.employee_id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Employee Detail Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Employee Details">
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {editMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      value={editData.phone}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={editData.department}
                      onChange={(e) => setEditData({...editData, department: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                    <input
                      type="text"
                      value={editData.job_title}
                      onChange={(e) => setEditData({...editData, job_title: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      value={editData.address}
                      onChange={(e) => setEditData({...editData, address: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={handleSaveEmployee}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedEmployee.name || 'Not Set'}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedEmployee.email}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedEmployee.phone || 'Not Set'}</span></div>
                  <div><span className="text-gray-500">Department:</span> <span className="font-medium">{selectedEmployee.department || 'Not Assigned'}</span></div>
                  <div><span className="text-gray-500">Job Title:</span> <span className="font-medium">{selectedEmployee.job_title || 'Not Set'}</span></div>
                  <div><span className="text-gray-500">Address:</span> <span className="font-medium">{selectedEmployee.address || 'Not Set'}</span></div>
                </div>
              )}
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}

            {/* Salary Info */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Salary Structure</h3>
                <button
                  onClick={() => setSalaryEditMode(!salaryEditMode)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {salaryEditMode ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {salaryEditMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Basic Salary (₹)</label>
                    <input
                      type="number"
                      value={salaryData.basic}
                      onChange={(e) => setSalaryData({...salaryData, basic: parseInt(e.target.value) || 0})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">HRA (₹)</label>
                    <input
                      type="number"
                      value={salaryData.hra}
                      onChange={(e) => setSalaryData({...salaryData, hra: parseInt(e.target.value) || 0})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Allowances (₹)</label>
                    <input
                      type="number"
                      value={salaryData.allowances}
                      onChange={(e) => setSalaryData({...salaryData, allowances: parseInt(e.target.value) || 0})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Deductions (₹)</label>
                    <input
                      type="number"
                      value={salaryData.deductions}
                      onChange={(e) => setSalaryData({...salaryData, deductions: parseInt(e.target.value) || 0})}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-2">
                      Net Salary: <span className="font-medium text-green-600">₹{(salaryData.basic + salaryData.hra + salaryData.allowances - salaryData.deductions)}</span>
                    </p>
                    <button
                      onClick={handleSaveSalary}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Salary'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Basic Salary:</span> <span className="font-medium">₹{selectedEmployee.salary?.basic || 0}</span></div>
                  <div><span className="text-gray-500">HRA:</span> <span className="font-medium">₹{selectedEmployee.salary?.hra || 0}</span></div>
                  <div><span className="text-gray-500">Allowances:</span> <span className="font-medium">₹{selectedEmployee.salary?.allowances || 0}</span></div>
                  <div><span className="text-gray-500">Deductions:</span> <span className="font-medium">₹{selectedEmployee.salary?.deductions || 0}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Net Salary:</span> <span className="font-medium text-green-600">₹{selectedEmployee.salary?.net || 0}</span></div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Documents</h3>
                <button
                  onClick={() => setShowDocRequestModal(true)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Request Document
                </button>
              </div>

              {/* Uploaded Documents for Review */}
              {uploadedDocs.filter(d => d.status === 'uploaded').length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-orange-700 mb-2">Documents Pending Review</h4>
                  <div className="space-y-2">
                    {uploadedDocs.filter(d => d.status === 'uploaded').map((doc) => (
                      <div key={doc.id} className="p-3 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{doc.document_type}</span>
                          <span className="text-xs text-gray-500">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200">
                            View Document
                          </a>
                          <button
                            onClick={() => handleApproveDocument(doc.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          {reviewingDoc === doc.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                className="flex-1 px-2 py-1 text-xs border rounded"
                              />
                              <button
                                onClick={() => handleRejectDocument(doc.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => { setReviewingDoc(null); setRejectReason(''); }}
                                className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewingDoc(doc.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                            >
                              Request Re-upload
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Documents */}
              {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Approved Documents</h4>
                  <div className="space-y-2">
                    {selectedEmployee.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                        <span className="text-sm">{doc.document_type || doc.filename}</span>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">View</a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No approved documents</p>
              )}

              {/* Pending Document Requests */}
              {selectedEmployee.pending_document_requests && selectedEmployee.pending_document_requests.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-yellow-700 mb-2">Pending Requests (Awaiting Upload)</h4>
                  <div className="space-y-2">
                    {selectedEmployee.pending_document_requests.map((req, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div>
                          <span className="text-sm font-medium">{req.document_type}</span>
                          {req.due_date && <span className="text-xs text-gray-500 ml-2">Due: {new Date(req.due_date).toLocaleDateString()}</span>}
                        </div>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Awaiting Upload</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Document Request Modal */}
      <Modal 
        isOpen={showDocRequestModal} 
        onClose={() => {
          setShowDocRequestModal(false);
          setDocRequestData({ document_type: '', description: '', due_date: '' });
        }} 
        title="Request Document Upload"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Request <strong>{selectedEmployee?.name || selectedEmployee?.email}</strong> to upload a document. An email notification will be sent to the employee.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
            <select
              value={docRequestData.document_type}
              onChange={(e) => setDocRequestData({...docRequestData, document_type: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select document type</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={docRequestData.description}
              onChange={(e) => setDocRequestData({...docRequestData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Add any specific instructions or details..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
            <input
              type="date"
              value={docRequestData.due_date}
              onChange={(e) => setDocRequestData({...docRequestData, due_date: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowDocRequestModal(false);
                setDocRequestData({ document_type: '', description: '', due_date: '' });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestDocument}
              disabled={docRequestLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {docRequestLoading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminEmployees;

