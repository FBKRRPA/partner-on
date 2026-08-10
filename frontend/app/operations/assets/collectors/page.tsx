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
  const [collectors, setCollectors] = useState<CollectorDto[]>([
    {
      id: 1,
      auth_code: "AST-88A9F2",
      name: "서울 본사 1층 수집기",
      customer_name: "(주) 글로벌 솔루션 강남점",
      ip_range: "192.168.1.1/24",
      status: "ONLINE",
      detected_count: 5,
      last_scanned_at: "2026-08-10 14:30:00",
    },
    {
      id: 2,
      auth_code: "AST-[#01916D]",
      name: "이천 물류 센타 수집기",
      customer_name: "삼정 IT 물류 센터",
      ip_range: "192.168.10.1/24",
      status: "ONLINE",
      detected_count: 12,
      last_scanned_at: "2026-08-10 14:28:15",
    },
  ]);

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
    <div className="min-h-screen bg-[#F4F6F8] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-[#01916D] rounded-md p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <span>FUJIFILM BI ON PORTAL</span>
            <span>&rsaquo;</span>
            <span>장비 관제</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">수집기 에이전트 현황</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                에이전트 수집기 레저 (Agent Collector Ledger)
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                고객사에 설치된 수집기 에이전트의 8자리 인증 코드(`AST-XXXXXX`) 발급 및 1:1 고객사 매칭 현황을 관제합니다.
              </p>
            </div>

            <button
              onClick={handleGenerateCode}
              className="px-4 py-2 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              + 에이전트 인증 코드 신규 생성
            </button>
          </div>
        </div>

        {/* High-Density B2B Data Table */}
        <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden p-5">
          <div className="border-l-4 border-[#01916D] pl-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase">
              에이전트 수집기 설치 목록
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              실시간 핑(Ping) 통신 및 SNMP 탐지 기기 수
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-normal text-slate-800 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-[11px] font-extrabold text-slate-700 uppercase">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200">인증 코드</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">수집기 명칭</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">1:1 매칭 고객사</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">스캔 IP 대역</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">연결 상태</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">탐지된 복합기</th>
                  <th className="py-2.5 px-3 text-center">최근 통신 시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {collectors.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-50/50 transition-all">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#01916D] border-r border-slate-200">{c.auth_code}</td>
                    <td className="py-2.5 px-3 font-bold border-r border-slate-200">{c.name}</td>
                    <td className="py-2.5 px-3 font-bold border-r border-slate-200">{c.customer_name || "-"}</td>
                    <td className="py-2.5 px-3 font-mono border-r border-slate-200">{c.ip_range}</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                      <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-emerald-100 text-[#01916D] border border-emerald-300">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right font-bold border-r border-slate-200">{c.detected_count} 대</td>
                    <td className="py-2.5 px-3 font-mono text-center text-slate-600">{c.last_scanned_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Code Generation Official Modal Popup */}
      {isModalOpen && newCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full shadow-2xl border border-slate-300 overflow-hidden">
            <div className="bg-[#01916D] text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-bold text-sm">에이전트 인증 코드 신규 발급</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-emerald-200 font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs text-slate-800">
              <p className="text-slate-600">아래 8자리 수집기 코드 및 매칭 고객사를 확인하십시오.</p>
              <div className="bg-slate-50 border border-slate-300 rounded p-4 text-center space-y-2">
                <span className="text-[10px] text-slate-500 block uppercase">Generated Auth Code</span>
                <div className="text-2xl font-black font-mono text-[#01916D]">{newCodeModal.code}</div>
                <div className="text-xs font-bold text-slate-700">매칭 고객사: {newCodeModal.customer}</div>
              </div>
            </div>
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-300 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-1.5 bg-[#01916D] text-white font-bold text-xs rounded">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
