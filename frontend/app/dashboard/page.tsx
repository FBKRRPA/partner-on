"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../components/layout/AppHeader";
import { AppFooter } from "../../components/layout/AppFooter";

export default function DashboardPage() {
  const [accessToken, setAccessToken] = useState("");
  const [workplaceName, setWorkplaceName] = useState("FBKR 파트너스");
  const [userName, setUserName] = useState("김영업 과장");

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);

    const savedWorkplace = sessionStorage.getItem("workplaceName") || "FBKR 파트너스";
    const savedUserName = sessionStorage.getItem("userName") || "김영업 과장";
    setWorkplaceName(savedWorkplace);
    setUserName(savedUserName);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Authoritative B2B Header & Breadcrumb Standard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-1">
              <span>통합 관제</span>
              <span>&rsaquo;</span>
              <span className="text-[#01916D] font-bold">대시보드</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
              {workplaceName} 자산 관제 대시보드
            </h1>
            <p className="text-xs text-[#5C5C5C] mt-1">
              접속 담당자: <strong className="text-slate-800 font-bold">{userName}</strong> | 소속 파트너사 실시간 자산 및 수집기 현황 관제
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-emerald-100/90 text-[#01916D] font-extrabold text-xs rounded-xl shadow-xs border border-emerald-200">
              ● 실시간 서버 연결 상태: 정상 (ONLINE)
            </span>
          </div>
        </div>

        {/* 4 Summary Stat Cards Standard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C5C5C]">정식 등록 복합기</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#01916D]"></span>
            </div>
            <div className="text-3xl font-black text-[#333333] font-mono mt-2">128 <span className="text-sm font-sans font-bold text-slate-500">대</span></div>
            <div className="text-xs font-bold text-[#01916D] mt-2 flex items-center gap-1">
              <span>✓ 100% 정상 수집중</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C5C5C]">미등록 탐지 복합기</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-3xl font-black text-amber-800 font-mono mt-2">14 <span className="text-sm font-sans font-bold text-slate-500">대</span></div>
            <div className="text-xs font-bold text-amber-700 mt-2 flex items-center gap-1">
              <span>⏳ 등록 승인 대기중</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C5C5C]">에이전트 수집기</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#01916D]"></span>
            </div>
            <div className="text-3xl font-black text-[#333333] font-mono mt-2">8 <span className="text-sm font-sans font-bold text-slate-500">개</span></div>
            <div className="text-xs font-bold text-[#01916D] mt-2 flex items-center gap-1">
              <span>✓ 고객사 1:1 매칭 완료</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C5C5C]">소모품 교체 경고</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#E01E35]"></span>
            </div>
            <div className="text-3xl font-black text-[#E01E35] font-mono mt-2">3 <span className="text-sm font-sans font-bold text-slate-500">건</span></div>
            <div className="text-xs font-bold text-[#E01E35] mt-2 flex items-center gap-1">
              <span>⚠️ 토너 잔량 10% 미만</span>
            </div>
          </div>
        </div>

        {/* B2B Table Container Standard */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#333333]">
                실시간 장비 관제 현황 (Realtime Device Ledger)
              </h2>
              <p className="text-xs text-[#5C5C5C] mt-0.5">
                소속 파트너사 설치 장비의 최신 SNMP OID 카운터 및 소모품 잔량 수집 상태
              </p>
            </div>
            <span className="px-3 py-1 bg-[#01916D]/10 text-[#01916D] text-xs font-bold rounded-lg">
              실시간 동기화 완료
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">시리얼 번호</th>
                  <th className="py-3.5 px-4">설치 고객사</th>
                  <th className="py-3.5 px-4">복합기 모델명</th>
                  <th className="py-3.5 px-4">IP 주소</th>
                  <th className="py-3.5 px-4 text-right">컬러 카운트</th>
                  <th className="py-3.5 px-4 text-right">흑백 카운트</th>
                  <th className="py-3.5 px-4 text-center">토너 잔량 (K/C/M/Y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#01916D]">FX-9988102</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">(주) 글로벌 솔루션 강남점</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">Fujifilm ApeosPort-VII C3373</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">192.168.1.105</td>
                  <td className="py-3.5 px-4 font-mono text-right font-bold text-slate-800">12,450 매</td>
                  <td className="py-3.5 px-4 font-mono text-right font-bold text-slate-800">84,120 매</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-lg text-xs">K: 80%</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-lg text-xs">C: 65%</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-lg text-xs">M: 70%</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-lg text-xs">Y: 90%</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#01916D]">CN-7738210</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">삼정 IT 물류 센터</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">Canon imageRUNNER C5535i</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">192.168.10.40</td>
                  <td className="py-3.5 px-4 font-mono text-right font-bold text-slate-800">45,100 매</td>
                  <td className="py-3.5 px-4 font-mono text-right font-bold text-slate-800">142,800 매</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="px-2 py-0.5 bg-rose-100 text-[#E01E35] font-bold rounded-lg text-xs">K: 8% (경고)</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-lg text-xs">C: 40%</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-lg text-xs">M: 50%</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-lg text-xs">Y: 35%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
