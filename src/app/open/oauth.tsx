import React, { useState } from 'react';
import { GitBranch, Github, Lock, Zap } from 'lucide-react';

export default function GitHubOAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubLogin = () => {
    setIsLoading(true);
    // Simulate OAuth flow
    setTimeout(() => {
      console.log('Redirecting to GitHub OAuth...');
      // window.location.href = 'https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID';
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Glowing Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GitBranch className="w-10 h-10" />
            <span className="text-3xl font-bold tracking-wider">GITFLOW</span>
          </div>
          <p className="text-white/70 text-sm">SECURE BRANCH MANAGEMENT PLATFORM</p>
        </div>

        {/* Main Card */}
        <div className="border-2 border-white bg-black/80 backdrop-blur-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 uppercase">Access Control</h1>
            <p className="text-white/70 text-sm">AUTHENTICATE TO CONTINUE</p>
          </div>

          {/* GitHub Login Button */}
          <button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full bg-white text-black py-4 px-6 font-bold hover:bg-gray-200 transition-all uppercase tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gray-200 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            <Github className="w-6 h-6 relative z-10" />
            <span className="relative z-10">
              {isLoading ? 'AUTHENTICATING...' : 'SIGN IN WITH GITHUB'}
            </span>
          </button>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 border-t border-white/30"></div>
            <span className="text-white/50 text-xs uppercase">Secure Connection</span>
            <div className="flex-1 border-t border-white/30"></div>
          </div>

          {/* Security Features */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs text-white/70">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-white mb-1">ENCRYPTED AUTHENTICATION</div>
                <div>End-to-end encrypted OAuth 2.0 protocol</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs text-white/70">
              <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-white mb-1">INSTANT ACCESS</div>
                <div>Connect your GitHub account in seconds</div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-center text-xs text-white/50">
              BY SIGNING IN, YOU AGREE TO OUR<br />
              <a href="#" className="text-white hover:text-gray-300 underline">TERMS OF SERVICE</a> AND <a href="#" className="text-white hover:text-gray-300 underline">PRIVACY POLICY</a>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-white/50">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-white/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-white/20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-white/20"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-white/20"></div>
    </div>
  );
}