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
    <div className="min-h-screen bg-[#F4F6F8] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-[#01916D] rounded-md p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <span>FUJIFILM BI ON PORTAL</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">통합 관제 대시보드</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {workplaceName} 자산 관제 대시보드
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                접속 담당자: <strong className="text-slate-900">{userName}</strong> | 소속 파트너사 실시간 자산 및 수집기 현황 관제
              </p>
            </div>
            <div>
              <span className="px-3 py-1 bg-emerald-100 text-[#01916D] border border-emerald-300 font-bold text-xs rounded-sm">
                실시간 서버 연결 상태: 정상 (ONLINE)
              </span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-300 rounded-md p-4 shadow-sm border-l-4 border-l-[#01916D]">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">정식 등록 복합기</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">128 대</div>
            <span className="text-[11px] font-bold text-[#01916D] mt-2 block">100% 정상 수집중</span>
          </div>

          <div className="bg-white border border-slate-300 rounded-md p-4 shadow-sm border-l-4 border-l-[#01916D]">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">미등록 탐지 복합기</span>
            <div className="text-2xl font-extrabold text-amber-800 font-mono mt-1">14 대</div>
            <span className="text-[11px] font-bold text-amber-700 mt-2 block">등록 승인 대기중</span>
          </div>

          <div className="bg-white border border-slate-300 rounded-md p-4 shadow-sm border-l-4 border-l-[#01916D]">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">에이전트 수집기</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">8 개</div>
            <span className="text-[11px] font-bold text-emerald-700 mt-2 block">고객사 1:1 매칭 완료</span>
          </div>

          <div className="bg-white border border-slate-300 rounded-md p-4 shadow-sm border-l-4 border-l-[#01916D]">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">소모품 교체 경고</span>
            <div className="text-2xl font-extrabold text-[#E01E35] font-mono mt-1">3 건</div>
            <span className="text-[11px] font-bold text-rose-700 mt-2 block">토너 잔량 10% 미만</span>
          </div>
        </div>

        {/* Dense Data Table Section */}
        <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden p-5">
          <div className="border-l-4 border-[#01916D] pl-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase">
              실시간 장비 관제 현황 (High-Density Monitoring)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              소속 파트너사 설치 장비의 최신 SNMP OID 카운터 수집 상태
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-normal text-slate-800 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-[11px] font-extrabold text-slate-700 uppercase">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200">시리얼 번호</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">설치 고객사</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">복합기 모델명</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">IP 주소</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">컬러 카운트</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">흑백 카운트</th>
                  <th className="py-2.5 px-3 text-center">토너 잔량 (K/C/M/Y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-emerald-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#01916D] border-r border-slate-200">FX-9988102</td>
                  <td className="py-2.5 px-3 font-bold border-r border-slate-200">(주) 글로벌 솔루션 강남점</td>
                  <td className="py-2.5 px-3 border-r border-slate-200">Fujifilm ApeosPort-VII C3373</td>
                  <td className="py-2.5 px-3 font-mono border-r border-slate-200">192.168.1.105</td>
                  <td className="py-2.5 px-3 font-mono text-right border-r border-slate-200">12,450 매</td>
                  <td className="py-2.5 px-3 font-mono text-right border-r border-slate-200">84,120 매</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-sm text-[10px]">K:80%</span>{" "}
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-sm text-[10px]">C:65%</span>{" "}
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-sm text-[10px]">M:70%</span>{" "}
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-sm text-[10px]">Y:90%</span>
                  </td>
                </tr>
                <tr className="hover:bg-emerald-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#01916D] border-r border-slate-200">CN-7738210</td>
                  <td className="py-2.5 px-3 font-bold border-r border-slate-200">삼정 IT 물류 센터</td>
                  <td className="py-2.5 px-3 border-r border-slate-200">Canon imageRUNNER C5535i</td>
                  <td className="py-2.5 px-3 font-mono border-r border-slate-200">192.168.10.40</td>
                  <td className="py-2.5 px-3 font-mono text-right border-r border-slate-200">45,100 매</td>
                  <td className="py-2.5 px-3 font-mono text-right border-r border-slate-200">142,800 매</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-sm text-[10px]">K:8% (경고)</span>{" "}
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-sm text-[10px]">C:40%</span>{" "}
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-sm text-[10px]">M:50%</span>{" "}
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-[#01916D] font-bold rounded-sm text-[10px]">Y:35%</span>
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
