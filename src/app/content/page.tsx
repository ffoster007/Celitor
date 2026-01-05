"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Table, Eye, Columns, Menu, Search, Bell, User, Download, Plus, Minus, MoreHorizontal, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

interface ExpandedState {
  [key: string]: boolean;
}

const DatabaseSchemaViewer = () => {
  const { data: session } = useSession();
  const [expandedTables, setExpandedTables] = useState<ExpandedState>({
    tables: true,
    products: true,
    indexes: false,
    views: true,
    price_avgs: true
  });
  const [expandedColumns, setExpandedColumns] = useState<ExpandedState>({
    products: true,
    price_avgs: true
  });
  const [selectedTab, setSelectedTab] = useState<string>('ERD');

  const toggleTable = (table: string) => {
    setExpandedTables(prev => ({...prev, [table]: !prev[table]}));
  };

  const toggleColumns = (table: string) => {
    setExpandedColumns(prev => ({...prev, [table]: !prev[table]}));
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Menu className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium">never-before-seen</span>
            <span className="text-xs text-gray-500">Inventory ⌄</span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Tables Section */}
          <div className="mb-2">
            <div 
              className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => toggleTable('tables')}
            >
              {expandedTables.tables ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
              <Table className="w-4 h-4 mr-2" />
              <span className="font-medium">Tables</span>
            </div>
            
            {expandedTables.tables !== false && (
              <div className="ml-4">
                {/* Products Table */}
                <div className="mb-1">
                  <div 
                    className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => toggleTable('products')}
                  >
                    {expandedTables.products ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                    <Table className="w-4 h-4 mr-2" />
                    <span>Products</span>
                  </div>
                  
                  {expandedTables.products && (
                    <div className="ml-6">
                      <div 
                        className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => toggleColumns('products')}
                      >
                        {expandedColumns.products ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                        <Columns className="w-4 h-4 mr-2" />
                        <span>Columns</span>
                        <span className="ml-auto text-xs text-gray-400">serial(255)</span>
                      </div>
                      
                      {expandedColumns.products && (
                        <div className="ml-6 space-y-1">
                          <div className="px-2 py-1 text-xs text-gray-600">product_id</div>
                          <div className="px-2 py-1 text-xs text-gray-600">name</div>
                          <div className="px-2 py-1 text-xs text-gray-600">category_id</div>
                          <div className="px-2 py-1 text-xs text-gray-600">supplier_id</div>
                          <div className="px-2 py-1 text-xs text-gray-600">description</div>
                          <div className="px-2 py-1 text-xs text-green-600 bg-green-50 rounded">price <span className="text-gray-400">decimal (6,2)</span></div>
                        </div>
                      )}
                      
                      <div className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                        <span className="w-4 h-4 mr-1" />
                        <span className="text-xs">Indexes</span>
                      </div>
                      <div className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                        <span className="w-4 h-4 mr-1" />
                        <span className="text-xs">category_id</span>
                      </div>
                      <div className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                        <span className="w-4 h-4 mr-1" />
                        <span className="text-xs">supplier_id</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Views Section */}
          <div className="mb-2">
            <div 
              className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => toggleTable('views')}
            >
              {expandedTables.views ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
              <Eye className="w-4 h-4 mr-2" />
              <span className="font-medium">Views</span>
            </div>
            
            {expandedTables.views && (
              <div className="ml-4">
                <div className="mb-1">
                  <div 
                    className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer bg-blue-50"
                    onClick={() => toggleTable('price_avgs')}
                  >
                    {expandedTables.price_avgs !== false ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                    <Eye className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-blue-600">price_avgs</span>
                  </div>
                  
                  {expandedTables.price_avgs !== false && (
                    <div className="ml-6">
                      <div 
                        className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => toggleColumns('price_avgs')}
                      >
                        {expandedColumns.price_avgs ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                        <Columns className="w-4 h-4 mr-2" />
                        <span className="text-xs">Columns</span>
                      </div>
                      
                      {expandedColumns.price_avgs && (
                        <div className="ml-6 space-y-1">
                          <div className="px-2 py-1 text-xs text-gray-600">category_name</div>
                          <div className="px-2 py-1 text-xs text-gray-600">avg-price</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tables (collapsed) */}
          <div className="mb-2">
            <div className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
              <ChevronRight className="w-4 h-4 mr-1" />
              <Table className="w-4 h-4 mr-2" />
              <span className="font-medium">Tables</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">From:</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option>2025</option>
              </select>
              <span className="text-gray-600">To:</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option>2024Oct</option>
              </select>
            </div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm">Diff</span>
            </label>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="w-5 h-5 text-gray-600" />
            {session?.user && (
              <div className="flex items-center space-x-3">
                {session.user.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
                <span className="text-sm text-gray-700">{session.user.name}</span>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-gray-600" />
              <span className="text-sm">Exp</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex space-x-6">
            {['ERD', 'SQL Plan', 'HCL Diff', 'SQL Diff'].map(tab => (
              <button
                key={tab}
                className={`px-1 py-3 text-sm font-medium border-b-2 ${
                  selectedTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex space-x-4">
            {/* Price Avgs Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 w-80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">price_avgs</h3>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="font-medium text-gray-500">Columns</span>
                  <span className="font-medium text-gray-500">Create Statement</span>
                  <span className="font-medium text-gray-500">Dependencies</span>
                </div>
                
                <div className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">NAME</span>
                    <span className="text-gray-500">TYPE</span>
                    <span className="text-gray-500">NULL</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>category_name</span>
                    <span className="text-blue-600">varchar(255)</span>
                    <span>No</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>avg-price</span>
                    <span className="text-blue-600">decimal(10,4)</span>
                    <span>Yes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Line */}
            <div className="flex items-center">
              <div className="w-32 h-px bg-gray-300 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>

            {/* Regions Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 w-80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Table className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold">regions</h3>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="font-medium text-gray-500">Columns</span>
                </div>
                
                <div className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">NAME</span>
                    <span className="text-gray-500">TYPE</span>
                    <span className="text-gray-500">NULL</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      region_id <span className="ml-1 text-blue-600">🔑</span>
                    </span>
                    <span className="text-blue-600">int</span>
                    <span>No</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>name</span>
                    <span className="text-blue-600">varchar(255)</span>
                    <span>No</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-end space-x-2">
          <button className="p-1 hover:bg-gray-100 rounded">
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchemaViewer;
