import { useState, useRef, useEffect } from 'react';
import Card from '../../components/Card';
import api from '../../services/api';

const AdminAIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insightType, setInsightType] = useState('general');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello Admin! I\'m your HR analytics assistant. I have access to all employee data, attendance records, leave patterns, and payroll information. Ask me anything about your organization\'s HR metrics.',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.generateAIInsights(insightType);
      setInsights({
        content: response.insights,
        type: response.type,
        generatedAt: response.generated_at
      });
    } catch (err) {
      console.error('Generate insights error:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input,
    };

    setMessages([...messages, userMessage]);
    const userQuery = input;
    setInput('');
    setChatLoading(true);

    try {
      const response = await api.aiChat(userQuery);
      
      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: response.response || 'I apologize, but I couldn\'t process your request.',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: 'I\'m sorry, I encountered an error. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const suggestedQuestions = [
    "What's the overall attendance rate this month?",
    "Which departments have the most pending leave requests?",
    "Analyze our payroll distribution",
    "What are the key HR concerns I should address?",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
        <p className="mt-1 text-sm text-gray-500">Get AI-powered insights and chat with your HR data</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Chat Section */}
        <Card className="flex flex-col h-[500px]">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Chat Assistant</h2>
          
          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="p-2 text-left text-xs bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full"></div>
                    <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                    <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about HR metrics..."
              disabled={chatLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={chatLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </Card>

        {/* Generate Insights Section */}
        <Card className="flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Generate Report</h2>
            <select
              value={insightType}
              onChange={(e) => setInsightType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General Overview</option>
              <option value="attendance">Attendance Analysis</option>
              <option value="leave">Leave Patterns</option>
              <option value="payroll">Payroll Insights</option>
            </select>
          </div>

          <button
            onClick={generateInsights}
            disabled={loading}
            className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Data...
              </span>
            ) : (
              '✨ Generate AI Insights'
            )}
          </button>

          <div className="flex-1 overflow-y-auto">
            {insights ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      {insights.type.charAt(0).toUpperCase() + insights.type.slice(1)} Analysis
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {insights.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-sm text-gray-500">Select a report type and click generate</p>
                <p className="text-xs text-gray-400 mt-1">AI will analyze your HR data</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAIInsights;

