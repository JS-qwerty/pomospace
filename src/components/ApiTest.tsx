import React, { useState } from 'react';

interface ApiResponse {
  status?: string;
  tasks?: any[];
  settings?: any;
  user?: any;
  error?: string;
}

export function ApiTest() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [endpoint, setEndpoint] = useState('/health');
  
  const testApi = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api${endpoint}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">API Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Endpoint
        </label>
        <div className="flex space-x-2">
          <select 
            className="flex-grow border border-gray-300 p-2 rounded-md"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          >
            <option value="/health">Health Check</option>
            <option value="/tasks">Tasks</option>
            <option value="/settings">Settings</option>
            <option value="/auth/me">Current User</option>
            <option value="/reports/summary">Reports Summary</option>
          </select>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            onClick={testApi}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Test'}
          </button>
        </div>
      </div>
      
      {result && (
        <div>
          <h3 className="text-lg font-medium mb-2">Response:</h3>
          <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 