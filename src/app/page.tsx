"use client";

import React, { useState } from 'react';
import { Zap, Book } from 'lucide-react';
import Link from 'next/link';

export default function GitBranchLanding() {
  const [activeSection, setActiveSection] = useState('hero');

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-black border-b-2 border-white z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/Calitors.png" alt="Celitor logo" className="w-8 h-8" />
            <span className="text-xl font-bold tracking-wider">CELITOR</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/landing" className="hover:text-gray-300 transition-colors uppercase text-sm tracking-wide">Pricing</Link>
            <Link href="/auth/pricing" className="bg-white text-black px-6 py-2 font-bold hover:bg-gray-200 transition-colors uppercase tracking-wide cursor-pointer">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Globe Effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] opacity-30">
          <div className="absolute inset-0 rounded-t-full border-4 border-white/30 overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)'
            }}></div>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center mb-20">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Understand repos fast<br />
            Organize knowledge clearly
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            CELITOR helps you analyze project structure, trace file paths, and save bookmarks so teams can grasp large codebases at a glance.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-black px-8 py-3 font-bold hover:bg-gray-200 transition-all uppercase tracking-wide">
              Explore the Repo
            </button>
            <button className="border-2 border-white text-white px-8 py-3 font-bold hover:bg-white hover:text-black transition-all uppercase tracking-wide">
              View Usage Guide
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          <div className="border-2 border-white bg-black/50 p-6 backdrop-blur-sm hover:bg-white/10 transition-all">
            <Book className="w-10 h-10 mb-4" />
            <h3 className="text-xl font-bold mb-2 uppercase">Repo Analysis</h3>
            <p className="text-white/70 text-sm">
              Analyze project structure and trace file paths to understand complex systems faster.
            </p>
          </div>
          
          <div className="border-2 border-white bg-black/50 p-6 backdrop-blur-sm hover:bg-white/10 transition-all">
            <Zap className="w-10 h-10 mb-4" />
            <h3 className="text-xl font-bold mb-2 uppercase">Bookmark Album</h3>
            <p className="text-white/70 text-sm">
              Save important files and code, group them into albums, and share insights instantly.
            </p>
          </div>
        </div>

        {/* Value Proposition */}
      </div>
    </div>
  );
}