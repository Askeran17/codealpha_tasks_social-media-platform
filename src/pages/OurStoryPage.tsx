import { useAuth } from '../contexts/AuthContext';

interface Props {
  onNavigate: (page: string, userId?: string) => void;
}

export default function OurStoryPage({ onNavigate }: Props) {
  const { user } = useAuth();

  return (
    <div className="p-3 sm:p-4 md:p-6 transition-all duration-300 min-h-screen flex flex-col justify-between">
      
      {/* Navbar */}
      <header className="flex justify-center sm:justify-start">
        <nav className="bg-white/60 backdrop-blur-md rounded-2xl shadow-sm px-4 py-2 flex items-center gap-4 sm:gap-6 transition-all duration-300">
          
          {/* Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0"
            aria-label="Go to landing page"
          >
            <svg className="w-8 h-8 shrink-0" viewBox="0 0 256 256" fill="currentColor">
              <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z" fill="black" />
              <path d="M 256 128 L 128 128 L 0 0 L 128 0 Z" fill="black" />
            </svg>
          </button>

          {/* Links */}
          <div className="flex items-center gap-6">
            {/* Home Link */}
            <button
              onClick={() => onNavigate('landing')}
              className="text-gray-800 text-sm font-medium hover:opacity-60 transition-opacity whitespace-nowrap cursor-pointer bg-transparent border-none p-0"
            >
              Home
            </button>
            {/* Our Story Link */}
            <button
              onClick={() => onNavigate('story')}
              className="text-gray-800 text-sm font-semibold hover:opacity-60 transition-opacity whitespace-nowrap cursor-pointer bg-transparent border-none p-0"
            >
              Our story
            </button>
          </div>

        </nav>
      </header>

      {/* Main Area (Centered Content) */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 py-6 max-w-xl mx-auto w-full">
        
        {/* Centered Card with Story */}
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 transition-all duration-300 text-gray-800">
            
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
                Our Story 📖
              </h1>
              <p className="text-xs text-gray-400 italic">
                A space for meaningful connections.
              </p>
            </div>

            <div className="flex flex-col gap-4 text-sm sm:text-base leading-relaxed text-gray-700 text-justify">
              <p>
                We believe that social connection should be a calm, beautiful, and deliberate experience. In a digital landscape often dominated by distracting algorithms and cluttered interfaces, we set out to build a quiet sanctuary—a minimal space focused entirely on the people you care about.
              </p>
              
              <p>
                Our platform was created to bring people closer together. It is a space designed for genuine communication, where you can share your thoughts, exchange ideas, and keep up with your friends without any of the clutter. Here, every post is a conversation, and every interaction is authentic.
              </p>

              <p>
                We focus on simplicity and ease of use, ensuring that your digital interactions feel as natural and visually pleasing as possible. We are dedicated to creating a social environment that respects your time and keeps you connected in a meaningful way.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={() => onNavigate('landing')}
                className="flex-1 bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer text-center"
              >
                Back to Home
              </button>
              {user ? (
                <button
                  onClick={() => onNavigate('feed')}
                  className="flex-1 bg-gray-100 text-black text-sm font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer text-center"
                >
                  Go to Feed
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('landing')}
                  className="flex-1 bg-gray-100 text-black text-sm font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer text-center"
                >
                  Join Feed
                </button>
              )}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
