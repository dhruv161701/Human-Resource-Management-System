import { useState, useEffect, useRef } from 'react';
import Card from '../../components/Card';
import api from '../../services/api';

const EmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const [pendingDocRequests, setPendingDocRequests] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const docFileInputRef = useRef(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileData, docRequestsData] = await Promise.all([
        api.getProfile(),
        api.getPendingDocumentRequests()
      ]);
      setProfile(profileData);
      setPhone(profileData.phone || '');
      setAddress(profileData.address || '');
      setName(profileData.name || '');
      setPendingDocRequests(docRequestsData.requests || []);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await api.updateProfile({ phone, address, name });
      setSuccess('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.uploadProfilePicture(file);
      setSuccess('Profile picture updated!');
      setProfile(prev => ({ ...prev, profile_picture: result.url }));
    } catch (err) {
      setError(err.message);
    }
    setUploading(false);
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRequest) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadingDoc(selectedRequest.id);
    setError('');
    setSuccess('');

    try {
      await api.uploadRequestedDocument(selectedRequest.id, file);
      setSuccess(`Document "${selectedRequest.document_type}" uploaded successfully!`);
      setSelectedRequest(null);
      fetchProfile();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    }
    setUploadingDoc(null);
  };

  const triggerDocUpload = (request) => {
    setSelectedRequest(request);
    docFileInputRef.current?.click();
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
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your profile information</p>
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

      <Card>
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <div className="flex-shrink-0">
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
              <div className="flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">JPG, PNG or GIF. Max size 2MB</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input
                  type="text"
                  value={profile?.employee_id || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={profile?.department || 'Not assigned'}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  value={profile?.job_title || 'Not assigned'}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Enter your address"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Card>

      {/* Salary Information */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Salary Structure</h3>
        {profile?.salary && (profile.salary.basic || profile.salary.hra || profile.salary.allowances || profile.salary.net) ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Basic Salary</p>
              <p className="text-lg font-semibold">₹{(profile.salary.basic || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">HRA</p>
              <p className="text-lg font-semibold">₹{(profile.salary.hra || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Allowances</p>
              <p className="text-lg font-semibold">₹{(profile.salary.allowances || 0).toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Deductions</p>
              <p className="text-lg font-semibold text-red-600">₹{(profile.salary.deductions || 0).toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg col-span-2 md:col-span-4">
              <p className="text-sm text-green-600">Net Salary (Monthly)</p>
              <p className="text-2xl font-bold text-green-700">₹{(profile.salary.net || 0).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2">Salary structure not yet assigned</p>
            <p className="text-sm">Contact HR for salary details</p>
          </div>
        )}
      </Card>

      {/* Pending Document Requests */}
      {pendingDocRequests.length > 0 && (
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Document Upload Requests
            <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              {pendingDocRequests.length} pending
            </span>
          </h3>
          <p className="text-sm text-gray-500 mb-4">HR has requested you to upload the following documents</p>
          <input
            type="file"
            ref={docFileInputRef}
            className="hidden"
            onChange={handleDocumentUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <div className="space-y-3">
            {pendingDocRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-gray-900">{request.document_type}</span>
                  </div>
                  {request.description && (
                    <p className="text-sm text-gray-600 mt-1 ml-7">{request.description}</p>
                  )}
                  {request.due_date && (
                    <p className="text-xs text-red-600 mt-1 ml-7">
                      Due: {new Date(request.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => triggerDocUpload(request)}
                  disabled={uploadingDoc === request.id}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {uploadingDoc === request.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documents */}
      {profile?.documents && profile.documents.length > 0 && (
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
          <div className="space-y-3">
            {profile.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-xs text-gray-500">{doc.document_type}</p>
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EmployeeProfile;

