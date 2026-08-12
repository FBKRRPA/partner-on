"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";

export interface CollectorDto {
  id: number;
  auth_code: string;
  name: string;
  customer_name?: string;
  ip_range: string;
  status: "ONLINE" | "OFFLINE" | "PENDING";
  detected_count: number;
  last_scanned_at?: string;
}

export default function CollectorsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [collectors, setCollectors] = useState<CollectorDto[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCodeModal, setNewCodeModal] = useState<{ code: string; customer: string } | null>(null);

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);
  }, []);

  function handleGenerateCode() {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const newCode = `AST-${randomHex}`;
    setNewCodeModal({ code: newCode, customer: "(주) 글로벌 솔루션 강남점" });
    setIsModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Authoritative B2B Header & Breadcrumb Standard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-1">
              <span>장비 관제</span>
              <span>&rsaquo;</span>
              <span className="text-[#01916D] font-bold">수집기 에이전트 현황</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
              에이전트 수집기 레저 (Agent Collector Ledger)
            </h1>
            <p className="text-xs text-[#5C5C5C] mt-1">
              고객사에 설치된 수집기 에이전트의 8자리 고유 인증 코드(`AST-XXXXXX`) 발급 및 1:1 고객사 매칭 현황을 실시간 관제합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateCode}
              className="px-4 py-2.5 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              + 에이전트 인증 코드 신규 생성
            </button>
          </div>
        </div>

        {/* B2B Table Container Standard */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#333333]">
                에이전트 수집기 설치 목록
              </h2>
              <p className="text-xs text-[#5C5C5C] mt-0.5">
                실시간 핑(Ping) 통신 및 SNMP 탐지 기기 수 현황
              </p>
            </div>
            <span className="px-3 py-1 bg-[#01916D]/10 text-[#01916D] text-xs font-bold rounded-lg">
              총 {collectors.length}대 수집기 가동 중
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">인증 코드</th>
                  <th className="py-3.5 px-4">수집기 명칭</th>
                  <th className="py-3.5 px-4">1:1 매칭 고객사</th>
                  <th className="py-3.5 px-4">스캔 IP 대역</th>
                  <th className="py-3.5 px-4 text-center">연결 상태</th>
                  <th className="py-3.5 px-4 text-right">탐지된 복합기</th>
                  <th className="py-3.5 px-4 text-center">최근 통신 시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collectors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold text-xs">
                      등록된 Agent 수집기가 없습니다. 상단 <strong className="text-[#01916D] font-bold">[+ 신규 수집기 발급]</strong> 버튼을 통해 생성해 주세요.
                    </td>
                  </tr>
                ) : (
                  collectors.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#01916D]">{c.auth_code}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{c.name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{c.customer_name || "-"}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">{c.ip_range}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#01916D]">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right font-bold text-slate-800">{c.detected_count} 대</td>
                      <td className="py-3.5 px-4 font-mono text-center text-xs text-slate-500">{c.last_scanned_at || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Clean Glass Overlay Modal Popup Standard */}
      {isModalOpen && newCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-[#01916D]/10 text-[#01916D] text-xs font-bold">
                  신규 수집기 발급
                </span>
                <h3 className="text-xl font-extrabold text-[#333333] mt-1">
                  에이전트 인증 코드 생성
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <p>생성된 8자리 수집기 인증 코드 및 1:1 매칭 고객사 정보를 확인해 주세요.</p>
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center space-y-2">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                  Generated Agent Code
                </span>
                <div className="text-3xl font-black font-mono text-[#01916D] tracking-tight">
                  {newCodeModal.code}
                </div>
                <div className="text-xs font-bold text-slate-700 pt-1">
                  매칭 고객사: {newCodeModal.customer}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
