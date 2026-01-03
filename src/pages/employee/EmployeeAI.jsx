import { useState, useRef, useEffect } from 'react';
import Card from '../../components/Card';
import api from '../../services/api';

const EmployeeAI = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your HR assistant powered by AI. I have access to your attendance, leave balance, salary information, and more. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
        content: response.response || 'I apologize, but I couldn\'t process your request. Please try again.',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: 'I\'m sorry, I encountered an error processing your request. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What is my current leave balance?",
    "Show me my attendance summary",
    "What is my salary structure?",
    "How do I apply for leave?",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">Get instant help with HR-related questions</p>
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 gap-2">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInput(question)}
              className="p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <Card className="flex flex-col h-[calc(100vh-300px)] min-h-[400px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
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
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
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

        <div className="border-t border-gray-200 pt-4">
          <form onSubmit={handleSend} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your attendance, leave, salary..."
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default EmployeeAI;

