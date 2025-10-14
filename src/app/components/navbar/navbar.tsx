"use client";
import React from "react";
import Image from "next/image";

const Toolbar = () => {
  return (
    <div className="fixed top-0 left-0 right-0 h-10 bg-[#323233] border-b border-[#464647] flex items-center text-white text-xs z-50">
      {/* Left Section - Logo and Menu */}
      <div className="flex items-center h-full">
        {/* Logo */}
        <div className="flex items-center px-3 h-full ">
          <Image
            src="/assets/Calitors.png"
            alt="Calitor Logo"
            width={20}
            height={20}
            priority
            className="mr-2"
          />
          <span className="text-white font-medium"></span>
        </div>
        
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 flex justify-center px-4">
        {/* <div className="flex items-center bg-[#3c3c3c] border border-[#464647] rounded-md px-3 py-1 w-full max-w-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#cccccc] mr-2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search files, commands, settings..."
            id="searchInput"
            className="bg-transparent border-none outline-none w-full text-[#cccccc] placeholder-[#969696] text-xs"
          />
        </div> */}
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center h-full">
        {/* Window Controls */}
        <div className="flex items-center space-x-1 px-2">
          {/* User Account */}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;