import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../src/config/api';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear messages when switching modes
  useEffect(() => {
    console.log("[Login] Mode changed. isRegistering:", isRegistering);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
  }, [isRegistering]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Login] Form submitted. isRegistering:", isRegistering);
    window.alert(`Form submitted! isRegistering: ${isRegistering}`);
    setError('');
    setSuccess('');

    if (isRegistering) {
      handleRegister();
    } else {
      handleLoginAuth();
    }
  };

  const handleRegister = async () => {
    console.log("[Login] handleRegister called with:", { name, email });
    try {
      console.log("[Login] Fetching signup from:", API_ENDPOINTS.signup);
      const response = await fetch(API_ENDPOINTS.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          // Check if user already exists
          if (data.message && data.message.toLowerCase().includes('already exists')) {
            setSuccess('Account already exists! Redirecting to login...');
            setTimeout(() => {
              setIsRegistering(false);
              setSuccess('');
            }, 1500);
            return;
          }
          setError(data.message || `Registration failed: ${response.status}`);
          return;
        }
        // Auto-login after successful registration
        setSuccess('Account created successfully! Logging you in...');
        localStorage.setItem('safeevac_current_user_email', email);
        setTimeout(() => onLogin(), 1500);
      } else {
        const text = await response.text();
        console.error("[Login] Received non-JSON response:", text);
        setError(`Server error (${response.status}): The server did not return JSON. This often means the backend crashed or the database connection failed.`);
      }
    } catch (err: any) {
      console.error("Register fetch error:", err);
      setError(`Connection Error: ${err.message || 'Check your internet or server status'}`);
    }
  };

  const handleLoginAuth = async () => {
    try {
      console.log("[Login] Fetching login from:", API_ENDPOINTS.login);
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || `Login failed: ${response.status}`);
          return;
        }
        setSuccess('Login successful! Redirecting...');
        localStorage.setItem('safeevac_current_user_email', email);
        setTimeout(() => onLogin(), 1500);
      } else {
        const text = await response.text();
        console.error("[Login] Received non-JSON response:", text);
        setError(`Server error (${response.status}): Non-JSON response received.`);
      }
    } catch (err: any) {
      console.error("Login fetch error:", err);
      setError(`Connection Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center shadow-lg">
            <img src="/safeevac-192.png" alt="SafeEvac Logo" className="h-12 w-12 rounded-lg" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {isRegistering ? 'Create Account' : 'SafeEvac'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Your AI disaster response assistant.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-700 mx-1 sm:mx-0">

          {/* Messages */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg p-4 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">{error}</span>
              </div>
              <p className="text-[10px] text-red-600 dark:text-red-400 font-bold ml-8">
                TIP: If you see a "Whitelisted" error, please check MongoDB Atlas &gt; Network Access.
              </p>
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg p-4 flex items-start gap-3">
              <CheckCircle className="text-green-500 h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium text-green-800 dark:text-green-300">{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                  placeholder="Enter username"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all active:scale-95"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  {isRegistering ? 'Already a member?' : 'New here?'}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => {
                  console.log("[Login] Toggling isRegistering. Current:", isRegistering);
                  window.alert(`Toggling to ${!isRegistering ? 'Register' : 'Login'}`);
                  setIsRegistering(!isRegistering);
                }}
                className="w-full flex justify-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                type="button"
              >
                {isRegistering ? 'Back to Login' : 'Create Free Account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('safeevac_guest_mode', 'true');
                  onLogin();
                }}
                className="w-full flex justify-center py-3 px-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline transition-all"
              >
                Launch as Guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};