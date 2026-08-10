"use client";

import React from "react";
import { AppHeader } from "../layout/AppHeader";
import { AppFooter } from "../layout/AppFooter";

interface ModuleCardProps {
  title: string;
  description: string;
  metricsLabel?: string;
  metricsValue?: string;
  statusBadge?: string;
}

interface MenuScaffoldPageProps {
  categoryTitle: string;
  menuTitle: string;
  description: string;
  modules?: ModuleCardProps[];
}

export function MenuScaffoldPage({
  categoryTitle,
  menuTitle,
  description,
  modules = [],
}: MenuScaffoldPageProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Fujifilm BI On Portal Page Header */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-[#01916D] rounded-md p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <span>FUJIFILM BI ON PORTAL</span>
            <span>&rsaquo;</span>
            <span>{categoryTitle}</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">{menuTitle}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {menuTitle} 레저 (Standard Ledger)
              </h1>
              <p className="text-xs text-slate-600 mt-1">{description}</p>
            </div>
            <div>
              <span className="px-3 py-1 bg-emerald-50 text-[#01916D] border border-[#01916D]/30 font-bold text-xs rounded-sm">
                후지필름 BI On 포털 표준 모듈
              </span>
            </div>
          </div>
        </div>

        {/* High-Density Enterprise B2B Data Table / Grid Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden p-5">
            <div className="border-l-4 border-[#01916D] pl-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {menuTitle} 세부 관제 모듈 목록
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                실시간 데이터 통합 관제 및 렌탈 자산 운용 서식
              </p>
            </div>

            {modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-300 rounded-md p-4 hover:border-[#01916D] hover:shadow-md transition-all border-l-4 border-l-[#01916D]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                      {m.statusBadge && (
                        <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-emerald-100 text-[#01916D] border border-emerald-300">
                          {m.statusBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {m.description}
                    </p>
                    {m.metricsLabel && (
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500">{m.metricsLabel}</span>
                        <strong className="font-mono text-slate-900">{m.metricsValue}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded p-8 text-center text-slate-500 text-xs font-medium">
                등록된 데이터가 없습니다. 관리자 권한으로 시스템을 운용하십시오.
              </div>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
