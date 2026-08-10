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
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Breadcrumb (Matches Contracts Page Exactly) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>{categoryTitle}</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">{menuTitle}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                {menuTitle} 레저 (Standard Ledger)
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">{description}</p>
            </div>
            <div>
              <span className="px-3.5 py-1.5 bg-emerald-50 text-[#01916D] border border-emerald-200 font-bold text-xs rounded-xl">
                기준정보 표준 모듈
              </span>
            </div>
          </div>
        </div>

        {/* Pure B2B Data Section (Matches Contracts Page Exactly) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              {menuTitle} 세부 관제 모듈 목록
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              실시간 데이터 통합 관제 및 렌탈 자산 운용 서식
            </p>
          </div>

          {modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {modules.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 hover:border-[#01916D] hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                    {m.statusBadge && (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-[#01916D]">
                        {m.statusBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                  {m.metricsLabel && (
                    <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                      <span className="text-slate-500">{m.metricsLabel}</span>
                      <strong className="font-mono text-slate-900">{m.metricsValue}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-medium">
              등록된 데이터가 없습니다. 관리자 권한으로 시스템을 운용하십시오.
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
