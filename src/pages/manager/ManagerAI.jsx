import { useState, useRef, useEffect } from 'react';
import Card from '../../components/Card';
import api from '../../services/api';

const ManagerAI = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello Manager! I\'m your HR assistant. I have access to your team\'s attendance, leave requests, and timesheet data. How can I help you manage your team today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input,
    };

    setMessages([...messages, userMessage]);
    const userQuery = input;
    setInput('');
    setLoading(true);

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
      setLoading(false);
    }
  };

  const generateTeamInsights = async () => {
    setInsightsLoading(true);
    setError('');
    try {
      const response = await api.generateAIInsights('general');
      setInsights(response.insights);
    } catch (err) {
      console.error('Generate insights error:', err);
      setError('Failed to generate team insights. Please try again.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Who has pending leave requests?",
    "Show me team attendance this week",
    "Any timesheets pending approval?",
    "Team performance summary",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">Get AI-powered insights about your team</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Chat Section */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[500px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat with AI</h2>
            
            {/* Suggested Questions */}
            {messages.length === 1 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="p-2 text-left text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
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
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
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
                placeholder="Ask about your team..."
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </Card>
        </div>

        {/* Team Insights Section */}
        <div className="lg:col-span-1">
          <Card className="flex flex-col h-[500px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Insights</h2>
            
            <button
              onClick={generateTeamInsights}
              disabled={insightsLoading}
              className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-md hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {insightsLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                '✨ Generate Team Insights'
              )}
            </button>

            <div className="flex-1 overflow-y-auto">
              {insights ? (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {insights}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">Click to generate insights</p>
                  <p className="text-xs text-gray-400 mt-1">AI will analyze your team data</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerAI;
