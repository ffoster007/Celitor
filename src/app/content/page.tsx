"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Columns,
  Eye,
  Minus,
  MoreHorizontal,
  Plus,
  Table,
  Upload,
} from "lucide-react";
import ActivityBar from "@/components/activitybar/page";
import Toolbar from "@/components/toolbar/page";

interface ExpandedState {
  [key: string]: boolean;
}

const DatabaseSchemaViewer = () => {
  const [expandedTables, setExpandedTables] = useState<ExpandedState>({
    tables: true,
    products: true,
    indexes: false,
    views: true,
    price_avgs: true,
  });
  const [expandedColumns, setExpandedColumns] = useState<ExpandedState>({
    products: true,
    price_avgs: true,
  });
  const [selectedTab, setSelectedTab] = useState<string>("ERD");

  const toggleTable = (table: string) => {
    setExpandedTables((prev) => ({ ...prev, [table]: !prev[table] }));
  };

  const toggleColumns = (table: string) => {
    setExpandedColumns((prev) => ({ ...prev, [table]: !prev[table] }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0c1420] text-emerald-50">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 border-r border-emerald-900/50 bg-[#0e1a27]/90 backdrop-blur">
            <div className="border-b border-emerald-900/50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-emerald-300/60">
                workspace
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-50">
                  never-before-seen
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 ring-1 ring-emerald-500/30">
                  Inventory
                </span>
              </div>
            </div>

            <div className="px-3 py-3">
              <div className="mb-3 flex items-center rounded-lg border border-emerald-900/60 bg-[#0f1f2d] px-3 py-2 text-sm text-emerald-100 shadow-inner">
                <span className="mr-2 h-2 w-2 rounded-full bg-emerald-400" />
                Connected to cluster-us-east
              </div>

              <div className="space-y-2">
                <div
                  className="flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm text-emerald-50 transition hover:bg-emerald-500/10"
                  onClick={() => toggleTable("tables")}
                >
                  {expandedTables.tables ? (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-2 h-4 w-4" />
                  )}
                  <Table className="mr-2 h-4 w-4 text-emerald-300" />
                  <span className="font-medium">Tables</span>
                </div>

                {expandedTables.tables && (
                  <div className="ml-6 space-y-2 border-l border-slate-800 pl-3">
                    <div
                      className="flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm text-emerald-50 transition hover:bg-emerald-500/10"
                      onClick={() => toggleTable("products")}
                    >
                      {expandedTables.products ? (
                        <ChevronDown className="mr-2 h-4 w-4" />
                      ) : (
                        <ChevronRight className="mr-2 h-4 w-4" />
                      )}
                      <Table className="mr-2 h-4 w-4 text-emerald-200" />
                      <span>Products</span>
                    </div>

                    {expandedTables.products && (
                      <div className="ml-4 space-y-1">
                        <div
                          className="flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm text-emerald-50 transition hover:bg-emerald-500/10"
                          onClick={() => toggleColumns("products")}
                        >
                          {expandedColumns.products ? (
                            <ChevronDown className="mr-2 h-4 w-4" />
                          ) : (
                            <ChevronRight className="mr-2 h-4 w-4" />
                          )}
                          <Columns className="mr-2 h-4 w-4 text-emerald-200/70" />
                          <span className="mr-auto">Columns</span>
                          <span className="text-[11px] text-emerald-200/60">
                            serial(255)
                          </span>
                        </div>

                        {expandedColumns.products && (
                          <div className="ml-6 space-y-1 text-xs text-emerald-100/70">
                            <div className="rounded px-2 py-1 hover:bg-emerald-500/10">
                              product_id
                            </div>
                            <div className="rounded px-2 py-1 hover:bg-emerald-500/10">
                              name
                            </div>
                            <div className="rounded px-2 py-1 hover:bg-emerald-500/10">
                              category_id
                            </div>
                            <div className="rounded px-2 py-1 hover:bg-emerald-500/10">
                              supplier_id
                            </div>
                            <div className="rounded px-2 py-1 hover:bg-emerald-500/10">
                              description
                            </div>
                            <div className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-100 ring-1 ring-emerald-500/40">
                              price <span className="text-emerald-200/70">decimal (6,2)</span>
                            </div>
                          </div>
                        )}

                        <div className="rounded px-2 py-1 text-xs text-emerald-100/70 hover:bg-emerald-500/10">
                          Indexes
                        </div>
                        <div className="rounded px-2 py-1 text-xs text-emerald-100/70 hover:bg-emerald-500/10">
                          category_id
                        </div>
                        <div className="rounded px-2 py-1 text-xs text-emerald-100/70 hover:bg-emerald-500/10">
                          supplier_id
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm text-emerald-50 transition hover:bg-emerald-500/10"
                  onClick={() => toggleTable("views")}
                >
                  {expandedTables.views ? (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-2 h-4 w-4" />
                  )}
                  <Eye className="mr-2 h-4 w-4 text-emerald-300" />
                  <span className="font-medium">Views</span>
                </div>

                {expandedTables.views && (
                  <div className="ml-6 space-y-2 border-l border-slate-800 pl-3">
                    <div
                      className="flex cursor-pointer items-center rounded-lg bg-gradient-to-r from-emerald-500/10 to-transparent px-2 py-1.5 text-sm text-emerald-100 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/15"
                      onClick={() => toggleTable("price_avgs")}
                    >
                      {expandedTables.price_avgs !== false ? (
                        <ChevronDown className="mr-2 h-4 w-4" />
                      ) : (
                        <ChevronRight className="mr-2 h-4 w-4" />
                      )}
                      <Eye className="mr-2 h-4 w-4" />
                      <span>price_avgs</span>
                    </div>

                    {expandedTables.price_avgs !== false && (
                      <div className="ml-4 space-y-1">
                        <div
                          className="flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm text-emerald-50 transition hover:bg-emerald-500/10"
                          onClick={() => toggleColumns("price_avgs")}
                        >
                          {expandedColumns.price_avgs ? (
                            <ChevronDown className="mr-2 h-4 w-4" />
                          ) : (
                            <ChevronRight className="mr-2 h-4 w-4" />
                          )}
                          <Columns className="mr-2 h-4 w-4 text-emerald-200/70" />
                          <span className="text-xs">Columns</span>
                        </div>

                        {expandedColumns.price_avgs && (
                          <div className="ml-6 space-y-1 text-xs text-emerald-100/70">
                            <div className="rounded px-2 py-1 hover:bg-emerald-500/10">
                              category_name
                            </div>
                            <div className="rounded px-2 py-1 hover:bg-emerald-500/10">
                              avg-price
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center rounded-lg px-2 py-1.5 text-sm text-emerald-200/60">
                  <ChevronRight className="mr-2 h-4 w-4" />
                  <Table className="mr-2 h-4 w-4" />
                  <span className="font-medium">Tables</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-900/50 bg-[#0e1a27]/90 px-6 py-3">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-emerald-300/70">
                  content
                </div>
                <div className="flex items-center space-x-2 text-sm text-emerald-50">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-100 ring-1 ring-emerald-500/30">
                    live diff
                  </span>
                  <span className="text-emerald-200/60">/</span>
                  <span className="font-semibold">{"2025 -> 2024Oct"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm text-emerald-100">
                <label className="flex items-center space-x-2 rounded-full bg-[#0f1f2d] px-3 py-1.5 ring-1 ring-emerald-900/40">
                  <input type="checkbox" className="rounded border-emerald-800 bg-[#0c1420]" defaultChecked />
                  <span>Diff</span>
                </label>
                <button className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-emerald-500/30 to-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-50 ring-1 ring-emerald-400/50 transition hover:-translate-y-0.5">
                  <Upload className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="border-b border-emerald-900/50 bg-[#0f1f2d]/90 px-6">
              <div className="flex space-x-6">
                {["ERD", "SQL Plan", "HCL Diff", "SQL Diff"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-1 py-3 text-sm font-semibold transition ${
                      selectedTab === tab
                        ? "border-b-2 border-emerald-400 text-emerald-100"
                        : "text-emerald-200/60 hover:text-emerald-100"
                    }`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gradient-to-br from-[#0c1420] via-[#0f1f2d] to-[#0c1420] p-6">
              <div className="flex space-x-5">
                <div className="w-80 rounded-2xl border border-emerald-900/60 bg-[#0f1f2d] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-emerald-300" />
                      <h3 className="text-sm font-semibold text-emerald-50">price_avgs</h3>
                    </div>
                    <button className="rounded-full p-2 text-emerald-200/70 transition hover:bg-emerald-500/10 hover:text-emerald-50">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2 text-[13px] text-emerald-200/70">
                      <span className="font-semibold text-emerald-50">Columns</span>
                      <span>Create Statement</span>
                      <span>Dependencies</span>
                    </div>

                    <div className="space-y-2 rounded-xl border border-emerald-900/50 bg-[#0c1420]/80 p-3">
                      <div className="flex items-center justify-between text-[13px] text-emerald-200/70">
                        <span className="font-semibold text-emerald-50">NAME</span>
                        <span>TYPE</span>
                        <span>NULL</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-50">category_name</span>
                        <span className="text-emerald-300">varchar(255)</span>
                        <span className="text-emerald-200/80">No</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-50">avg-price</span>
                        <span className="text-emerald-300">decimal(10,4)</span>
                        <span className="text-emerald-200/80">Yes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="relative h-px w-32 bg-emerald-900">
                    <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-400" />
                    <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-300" />
                  </div>
                </div>

                <div className="w-80 rounded-2xl border border-emerald-900/60 bg-[#0f1f2d] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Table className="h-5 w-5 text-emerald-200" />
                      <h3 className="text-sm font-semibold text-emerald-50">regions</h3>
                    </div>
                    <button className="rounded-full p-2 text-emerald-200/70 transition hover:bg-emerald-500/10 hover:text-emerald-50">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2 text-[13px] text-emerald-200/70">
                      <span className="font-semibold text-emerald-50">Columns</span>
                      <span className="text-emerald-300/40">Create Statement</span>
                      <span className="text-emerald-300/40">Dependencies</span>
                    </div>

                    <div className="space-y-2 rounded-xl border border-emerald-900/50 bg-[#0c1420]/80 p-3">
                      <div className="flex items-center justify-between text-[13px] text-emerald-200/70">
                        <span className="font-semibold text-emerald-50">NAME</span>
                        <span>TYPE</span>
                        <span>NULL</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-emerald-50">
                          region_id <span className="ml-1 text-emerald-300">🔑</span>
                        </span>
                        <span className="text-emerald-300">int</span>
                        <span className="text-emerald-200/80">No</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-50">name</span>
                        <span className="text-emerald-300">varchar(255)</span>
                        <span className="text-emerald-200/80">No</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-emerald-900/50 bg-[#0e1a27]/90 px-6 py-2">
              <button className="rounded-lg p-2 text-emerald-200 transition hover:bg-emerald-500/10">
                <Minus className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 text-emerald-200 transition hover:bg-emerald-500/10">
                <Plus className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 text-emerald-200 transition hover:bg-emerald-500/10">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchemaViewer;
