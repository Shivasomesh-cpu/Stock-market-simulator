import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { LineChart, AlertCircle, ArrowRight, ExternalLink, RefreshCw, XCircle } from 'lucide-react';

export default function Login() {
  const { user, userData } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const navigate = useNavigate();

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Auto-redirect if already signed in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Track time elapsed during Google Sign-in to help the user if the popup is hidden or blocked
  useEffect(() => {
    if (googleLoading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= 28) {
            clearInterval(timerRef.current);
            setGoogleLoading(false);
            setError(
              'Sign-in timed out. The Google popup was likely blocked or opened behind this window. Please click "Open in New Tab" below for instant sign-in.'
            );
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [googleLoading]);

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleCancelGoogleSignIn = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGoogleLoading(false);
    setError('Sign-in cancelled. You can try again or open in a new tab.');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Use standard popup sign-in
      await signInWithPopup(auth, provider);
      // User profile initialization is handled automatically by AuthProvider
      navigate('/');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked by your browser. Please allow popups or click "Open in New Tab" below.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Previous sign-in request was cancelled. Please try again.');
      } else {
        setError(err.message || 'Google sign-in failed. Please try opening the app in a new tab.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          'Email/Password sign-in is not enabled in this Firebase project. Please use "Continue with Google" to sign in with your Google account.'
        );
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 sm:p-8">
        
        {/* In-Iframe Helper Notification */}
        {isInIframe && (
          <div className="mb-5 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-center justify-between gap-2">
            <span>Running inside preview? Open in a full tab for direct 1-click Google Sign-In.</span>
            <button
              onClick={handleOpenNewTab}
              className="shrink-0 font-semibold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Tab</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <LineChart className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {isRegister ? 'Create Trading Account' : 'Welcome to TradeSim'}
          </h2>
          <p className="text-sm text-zinc-500 mt-1 text-center">
            Real-time multiplayer stock market simulation
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Primary 1-Click Google Sign-In */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 font-medium py-2.5 px-4 rounded-xl border border-zinc-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          {/* Active Loading Guidance Banner */}
          {googleLoading && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Waiting for Google account ({elapsedSeconds}s)...</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelGoogleSignIn}
                  className="text-zinc-500 hover:text-zinc-800 font-medium underline flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
              <p className="text-amber-800/90 leading-relaxed">
                Check for the Google popup window — it might be behind this browser window or blocked in your address bar.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <span>Open in Full Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Direct Open in New Tab Action */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="text-xs text-zinc-500 hover:text-blue-600 inline-flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <span>Having trouble? Open simulator in new browser tab</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-zinc-200 w-full"></div>
            <span className="bg-white px-3 text-xs uppercase tracking-wider text-zinc-400 font-medium absolute">
              or with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shiva Somesh"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-sm text-zinc-600">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-blue-600 font-semibold hover:underline focus:outline-none cursor-pointer"
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

