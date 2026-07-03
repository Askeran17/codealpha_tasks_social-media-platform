import { useState, useEffect } from 'react';
import { PSpinner } from '@porsche-design-system/components-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import OurStoryPage from './pages/OurStoryPage';
import { api } from './lib/api';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4';

function LandingPage({ onNavigate }: { onNavigate: (page: string, userId?: string) => void }) {
  const { user, profile, signOut, setUser, setProfile } = useAuth();
  
  // Registration Form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Login Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Mode selection: 'register' | 'login'
  const [authMode, setAuthMode] = useState<'register' | 'login'>('login');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regUsername.length < 3) {
      setRegError('Username must be at least 3 characters.');
      return;
    }
    setRegLoading(true);

    try {
      const data = await api.register(regUsername, regEmail, regPassword);
      setUser(data.session.user);
      setProfile(data.profile);
    } catch (err: any) {
      setRegError(err.message || 'Unexpected error during registration.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const data = await api.login(loginEmail, loginPassword);
      setUser(data.session.user);
      setProfile(data.profile);
    } catch (err: any) {
      setLoginError(err.message || 'Unexpected error during sign in.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 transition-all duration-300 min-h-screen flex flex-col justify-between">
      
      {/* Navbar */}
      <header className="flex justify-center sm:justify-start">
        <nav className="bg-white/60 backdrop-blur-md rounded-2xl shadow-sm px-4 py-2 flex items-center gap-4 sm:gap-6 transition-all duration-300">
          
          {/* Logo */}
          <div className="flex items-center">
            <svg className="w-8 h-8 shrink-0" viewBox="0 0 256 256" fill="currentColor">
              <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z" fill="black" />
              <path d="M 256 128 L 128 128 L 0 0 L 128 0 Z" fill="black" />
            </svg>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {/* Home Link */}
            <button
              onClick={() => onNavigate('landing')}
              className="text-gray-800 text-sm font-semibold hover:opacity-60 transition-opacity whitespace-nowrap cursor-pointer bg-transparent border-none p-0"
            >
              Home
            </button>
            {/* Our Story Link */}
            <button
              onClick={() => onNavigate('story')}
              className="text-gray-800 text-sm font-medium hover:opacity-60 transition-opacity whitespace-nowrap cursor-pointer bg-transparent border-none p-0"
            >
              Our story
            </button>
          </div>
        </nav>
      </header>

      {/* Main Area (Centered Headline & Auth Card) */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 py-6 max-w-xl mx-auto w-full">
        
        {/* Headline */}
        <p className="text-white text-3xl sm:text-4xl xl:text-5xl font-medium leading-tight drop-shadow-lg text-center">
          Connect, share, and stay
          <br />
          close to the people who{' '}
          <span
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontWeight: 400,
            }}
          >
            matter
          </span>
        </p>

        {/* Centered Card (Registration/Login Form or User Profile Actions) */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 flex flex-col gap-4 transition-all duration-300">
            
            {user ? (
              /* Authenticated User state */
              <div className="flex flex-col gap-4 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  Welcome back, {profile?.username || 'User'}! 👋
                </h2>
                <p className="text-sm text-gray-500">
                  You are logged in. Access the feed or manage your profile from here.
                </p>

                <div className="flex flex-col gap-2.5 mt-2">
                  <button
                    onClick={() => onNavigate('feed')}
                    className="w-full bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer text-center"
                  >
                    Go to Feed
                  </button>
                  <button
                    onClick={() => onNavigate('profile', user.id)}
                    className="w-full bg-gray-100 text-black text-sm font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer text-center"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={signOut}
                    className="w-full bg-transparent text-red-600 border border-red-200 text-sm font-semibold py-3 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer text-center"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : authMode === 'register' ? (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                    Create account 🚀
                  </h2>
                  <p className="text-xs text-gray-400">
                    Sign up to connect with the social media feed.
                  </p>
                </div>

                {regError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg font-medium">
                    {regError}
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="Username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-black text-white text-sm font-semibold py-3 rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {regLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="text-center mt-1">
                  <span className="text-xs text-gray-500">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs font-semibold text-black underline hover:opacity-75 cursor-pointer bg-transparent border-none p-0"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                    Welcome back 👋
                  </h2>
                  <p className="text-xs text-gray-400">
                    Sign in to your account.
                  </p>
                </div>

                {loginError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg font-medium">
                    {loginError}
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-black text-white text-sm font-semibold py-3 rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loginLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="text-center mt-1">
                  <span className="text-xs text-gray-500">Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-xs font-semibold text-black underline hover:opacity-75 cursor-pointer bg-transparent border-none p-0"
                  >
                    Register
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}

type Page = 'landing' | 'feed' | 'profile' | 'login' | 'register' | 'story';

function AppRouter() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>(() => {
    return (localStorage.getItem('page') as Page) || 'landing';
  });
  const [profileUserId, setProfileUserId] = useState<string | null>(() => {
    return localStorage.getItem('profileUserId');
  });

  useEffect(() => {
    if (!loading && !user) {
      setPage('landing');
      setProfileUserId(null);
      localStorage.setItem('page', 'landing');
      localStorage.removeItem('profileUserId');
    }
  }, [user, loading]);

  function handleNavigate(target: string, userId?: string) {
    localStorage.setItem('page', target);
    if (target === 'profile' && userId) {
      setProfileUserId(userId);
      localStorage.setItem('profileUserId', userId);
      setPage('profile');
    } else {
      setProfileUserId(null);
      localStorage.removeItem('profileUserId');
      if (target === 'feed') {
        setPage('feed');
      } else if (target === 'landing') {
        setPage('landing');
      } else if (target === 'story') {
        setPage('story');
      } else if (target === 'login' || target === 'register') {
        setPage(target as Page);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <PSpinner size="large" aria={{ 'aria-label': 'Loading' }} />
      </div>
    );
  }

  // Routing checks
  if (!user) {
    if (page === 'login') {
      return <LoginPage onNavigate={handleNavigate} />;
    }
    if (page === 'register') {
      return <RegisterPage onNavigate={handleNavigate} />;
    }
    if (page === 'story') {
      return <OurStoryPage onNavigate={handleNavigate} />;
    }
    if (page !== 'landing') {
      return <LandingPage onNavigate={handleNavigate} />;
    }
  } else {
    // If logged in and trying to access login/register, redirect to feed
    if (page === 'login' || page === 'register') {
      return <FeedPage onNavigate={handleNavigate} />;
    }
  }

  if (page === 'profile' && profileUserId) {
    return <ProfilePage userId={profileUserId} onNavigate={handleNavigate} />;
  }

  if (page === 'feed') {
    return <FeedPage onNavigate={handleNavigate} />;
  }

  if (page === 'story') {
    return <OurStoryPage onNavigate={handleNavigate} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="relative min-h-screen w-full overflow-x-hidden">
        
        {/* Global Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        {/* Dark overlay to make text more readable */}
        <div className="fixed inset-0 bg-black/25 z-0 pointer-events-none" />

        {/* Active Page Route Container */}
        <div className="relative z-10 w-full min-h-screen">
          <AppRouter />
        </div>

      </div>
    </AuthProvider>
  );
}
