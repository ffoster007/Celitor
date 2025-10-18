"use client";
import React, { useState } from 'react';
import { SendToBack, Cuboid, Square } from 'lucide-react';

export default function VSCodeSidebar() {
  const [activeTab, setActiveTab] = useState('files');

  const tabs = [
    { id: 'layers', icon: Square, label: 'Explorer' },
    { id: 'cuboid', icon: Cuboid, label: 'Cuboid' },
    { id: 'send-to-back', icon: SendToBack, label: 'Control' },
  ];

  return (
    <div className="flex h-[calc(100vh-2.5rem)] text-gray-300 mt-10">
      {/* Activity Bar */}
      <div className="w-12 bg-[#161616] flex flex-col items-center py-2 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-12 h-12 flex items-center justify-center hover:text-white cursor-pointer ${
                activeTab === tab.id ? 'text-white border-l-2' : ''
              }`}
              title={tab.label}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </div>
    </div>
  );
}