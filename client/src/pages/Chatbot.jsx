import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, X, Power, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "👋 Hello! I'm your AI financial assistant. I can help you understand your spending, budgets, debts, and provide personalized financial advice. What would you like to know?",
      timestamp: new Date().toISOString()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [showOllamaWarning, setShowOllamaWarning] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('chatbot-model') || 'llama3.2:1b';
  });
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [pendingModel, setPendingModel] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Save selected model to localStorage
  useEffect(() => {
    localStorage.setItem('chatbot-model', selectedModel);
  }, [selectedModel]);

  const models = [
    { id: 'llama3.2:1b', name: 'Llama 3.2 1B', params: '1B', speed: 'Quick', desc: 'Fastest responses, basic accuracy', size: '1.3GB' },
    { id: 'llama3.2:3b', name: 'Llama 3.2 3B', params: '3B', speed: 'Accurate', desc: 'Balanced speed & intelligence', size: '2.0GB' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showModelDropdown && !event.target.closest('.model-dropdown-container')) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelDropdown]);

  // Check Ollama status on mount
  useEffect(() => {
    const checkOllamaStatus = async () => {
      try {
        const response = await api.get('/chatbot/status');
        setOllamaStatus(response.data.ollamaOnline);
        setShowOllamaWarning(true); // Always show popup on first load
      } catch (error) {
        setOllamaStatus(false);
        setShowOllamaWarning(true);
      }
    };
    checkOllamaStatus();
  }, []);

  // Toggle between Advanced and Basic mode
  const toggleAdvancedMode = async () => {
    setIsTogglingMode(true);
    try {
      if (ollamaStatus) {
        // Turn off Advanced Mode
        await api.post('/chatbot/toggle-ollama', { action: 'stop' });
        setOllamaStatus(false);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          content: '🔄 Switched to Basic Mode. Advanced AI features are now disabled.',
          timestamp: new Date().toISOString()
        }]);
      } else {
        // Turn on Advanced Mode
        const response = await api.post('/chatbot/toggle-ollama', { action: 'start' });
        if (response.data.success) {
          setOllamaStatus(true);
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'bot',
            content: '✨ Switched to Advanced Mode! You now have access to AI-powered conversations.',
            timestamp: new Date().toISOString()
          }]);
        } else {
          throw new Error('Failed to start Ollama');
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        content: '⚠️ Failed to toggle mode. Please ensure Ollama is installed on your system.',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsTogglingMode(false);
    }
  };

  const handleModelChange = async (modelId) => {
    const model = models.find(m => m.id === modelId);
    setShowModelDropdown(false);
    
    // Check if model is available locally
    try {
      const response = await api.post('/chatbot/check-model', { model: modelId });
      
      if (!response.data.available) {
        // Model not available, show installation popup
        setPendingModel(model);
        setShowInstallPopup(true);
      } else {
        // Model available, switch to it
        setSelectedModel(modelId);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          content: `🔄 Switched to ${model.name} (${model.params} parameters). ${model.desc}.`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error checking model:', error);
      // Fallback: assume model is available
      setSelectedModel(modelId);
    }
  };

  const handleInstallModel = async () => {
    if (!pendingModel) return;
    
    setShowInstallPopup(false);
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'bot',
      content: `📥 Installing ${pendingModel.name} (${pendingModel.size})...\n\nThis may take a few minutes. You'll be notified when it's ready.`,
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await api.post('/chatbot/install-model', { model: pendingModel.id });
      
      if (response.data.success) {
        setSelectedModel(pendingModel.id);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          content: `✅ ${pendingModel.name} installed successfully! Switched to this model.`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error('Installation failed');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        content: `❌ Failed to install ${pendingModel.name}. Please install manually:\n\nollama pull ${pendingModel.id}`,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setPendingModel(null);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      const response = await api.post('/chatbot/message', { message, model: selectedModel });
      return response.data;
    },
    onSuccess: (data) => {
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        content: data.message,
        timestamp: data.timestamp
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error) => {
      const isOllamaOffline = error?.response?.data?.ollamaOffline;
      if (isOllamaOffline) {
        setShowOllamaWarning(true);
        setOllamaStatus(false);
      }
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        content: isOllamaOffline 
          ? "⚠️ Advanced chatbot is currently offline. I can still help with basic financial queries about your spending, budgets, and debts!"
          : "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Show my spending",
    "How's my budget?",
    "Check my debts",
    "Savings advice"
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Model Installation Popup */}
      {showInstallPopup && pendingModel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Install {pendingModel.name}?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  This model is not installed on your system. Would you like to download it now?
                </p>
                
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Model:</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{pendingModel.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Parameters:</span>
                      <span className="text-xs text-gray-900 dark:text-gray-100">{pendingModel.params}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Download Size:</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{pendingModel.size}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Speed:</span>
                      <span className="text-xs text-gray-900 dark:text-gray-100">{pendingModel.speed}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 italic">{pendingModel.desc}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowInstallPopup(false);
                      setPendingModel(null);
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInstallModel}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Install Now
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  Installation may take a few minutes depending on your connection
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInstallPopup(false);
                  setPendingModel(null);
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Status Popup with inline toggle */}
      {showOllamaWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${ollamaStatus ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                {ollamaStatus ? (
                  <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {ollamaStatus ? 'Advanced Chatbot Online' : 'You are in Basic Mode'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {ollamaStatus
                    ? 'Advanced AI features are active. You have access to AI-powered conversations and personalized financial insights.'
                    : 'Advanced AI features are unavailable. Basic financial queries about your spending, budgets, and debts will still work.'}
                </p>
                <div className={`rounded-lg p-3 mb-4 border ${ollamaStatus ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${ollamaStatus ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}`}>
                      Mode: {ollamaStatus ? 'Advanced' : 'Basic'}
                    </p>
                    <button
                      onClick={toggleAdvancedMode}
                      disabled={isTogglingMode}
                      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors ${ollamaStatus ? 'bg-green-500' : 'bg-gray-400'} disabled:opacity-50`}
                      aria-label="Toggle chatbot mode"
                      title={ollamaStatus ? 'Switch to Basic Mode' : 'Switch to Advanced Mode'}
                    >
                      <span className={`inline-block h-5 w-5 bg-white rounded-full transform transition-transform ${ollamaStatus ? 'translate-x-6' : 'translate-x-1'}`}></span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowOllamaWarning(false)}
                  className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${ollamaStatus ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'}`}
                >
                  {ollamaStatus ? 'Start Chatting' : 'Continue in Basic Mode'}
                </button>
              </div>
              <button
                onClick={() => setShowOllamaWarning(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Bot className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Financial Assistant</h1>
            <p className="text-blue-100 text-xs mt-0.5">
              AI-powered financial advisor
            </p>
          </div>
          
          {/* Model Selector & Mode Toggle */}
          <div className="flex items-center gap-3">
            {/* Model Dropdown */}
            {ollamaStatus && (
              <div className="relative model-dropdown-container">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  <Bot className="h-4 w-4 text-white" />
                  <span className="text-xs font-medium text-white">
                    {models.find(m => m.id === selectedModel)?.name || 'Llama 3.2 3B'}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-white/70 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showModelDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                    <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{models.find(m => m.id === selectedModel)?.name || 'Select AI Model'}</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => handleModelChange(model.id)}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                            selectedModel === model.id ? 'bg-blue-100 dark:bg-gray-700' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{model.name}</span>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              {model.speed}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{model.desc}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-500">{model.params} • {model.size}</span>
                            {selectedModel === model.id && (
                              <span className="text-xs text-green-600 dark:text-green-400">✓ Active</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Mode Toggle Switch */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-medium text-white/90">
                {ollamaStatus ? 'Advanced' : 'Basic'}
              </span>
              <button
                onClick={toggleAdvancedMode}
                disabled={isTogglingMode || ollamaStatus === null}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                  ollamaStatus 
                    ? 'bg-green-500' 
                    : 'bg-gray-400'
                } ${isTogglingMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={ollamaStatus ? 'Switch to Basic Mode' : 'Switch to Advanced Mode'}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform flex items-center justify-center ${
                    ollamaStatus ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                >
                  {isTogglingMode ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-purple-600" />
                  ) : (
                    <Power className={`h-2 w-2 ${ollamaStatus ? 'text-green-600' : 'text-gray-400'}`} />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.type === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                  : message.isError
                  ? 'bg-red-100'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}
            >
              {message.type === 'user' ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className={`h-4 w-4 ${message.isError ? 'text-red-600' : 'text-white'}`} />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`flex flex-col max-w-[75%] ${
                message.type === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`rounded-lg px-3 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.isError
                    ? 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800'
                    : 'bg-white text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              </div>
              
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-2">
                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {sendMessageMutation.isPending && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors shadow-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your finances..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              rows="1"
              style={{ maxHeight: '120px' }}
              disabled={sendMessageMutation.isPending}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessageMutation.isPending}
            className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
