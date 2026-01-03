import { useState } from 'react';
import Card from '../../components/Card';
import { mockAttendance, mockLeaves } from '../../data/mockData';

const AdminAIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const attendanceAnomalies = mockAttendance.filter((att) => att.status === 'Absent').length;
      const frequentLeavePattern = mockLeaves.filter((leave) => leave.leaveType === 'Sick Leave').length;

      setInsights({
        attendanceAnomalies: [
          `${attendanceAnomalies} employees have attendance anomalies this month`,
          'Pattern detected: High absenteeism on Mondays',
          'Recommendation: Review attendance policies and employee engagement',
        ],
        leavePatterns: [
          `Most common leave type: Sick Leave (${frequentLeavePattern} requests)`,
          'Leave requests spike in January and December',
          'Recommendation: Consider flexible leave policies during peak months',
        ],
        recommendations: [
          'Implement automated attendance tracking system',
          'Create employee wellness programs to reduce sick leave',
          'Review and update leave policies based on current patterns',
          'Set up alerts for unusual attendance patterns',
        ],
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="mt-1 text-sm text-gray-500">Get AI-powered insights and recommendations</p>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating...' : 'Generate AI Insights'}
        </button>
      </div>

      {loading && (
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-500">Analyzing data and generating insights...</p>
          </div>
        </Card>
      )}

      {insights && !loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Anomalies</h2>
            <ul className="space-y-3">
              {insights.attendanceAnomalies.map((item, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Patterns</h2>
            <ul className="space-y-3">
              {insights.leavePatterns.map((item, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">HR Recommendations</h2>
            <ul className="space-y-3">
              {insights.recommendations.map((item, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {!insights && !loading && (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No insights generated</h3>
            <p className="mt-1 text-sm text-gray-500">Click the button above to generate AI-powered insights</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminAIInsights;

