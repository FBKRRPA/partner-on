"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { getApiBaseUrl } from "../../../lib/auth-api";

interface PartnerUsageSummary {
  id: number;
  workplace_name: string;
  owner_name: string;
  device_count: number;
  monthly_color: number;
  monthly_mono: number;
  monthly_total: number;
  collector_status: string;
  last_updated: string;
}

export default function PartnerAdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<PartnerUsageSummary[]>([]);
  const [totalWorkplacesCount, setTotalWorkplacesCount] = useState(0);
  const [totalDevicesCount, setTotalDevicesCount] = useState(0);
  const [totalMonthlyColor, setTotalMonthlyColor] = useState(0);
  const [totalMonthlyMono, setTotalMonthlyMono] = useState(0);

  useEffect(() => {
    const isDemo = sessionStorage.getItem("partneron_demo_mode") === "true";
    if (isDemo) {
      const demoPartners: PartnerUsageSummary[] = [
        {
          id: 1,
          workplace_name: "(주) 글로벌 솔루션 파트너스",
          owner_name: "홍길동 대표",
          device_count: 5,
          monthly_color: 115450,
          monthly_mono: 299620,
          monthly_total: 415070,
          collector_status: "ONLINE",
          last_updated: "2026-08-11 14:30:00",
        },
        {
          id: 2,
          workplace_name: "삼정 IT 물류 시스템",
          owner_name: "김철수 이사",
          device_count: 4,
          monthly_color: 89500,
          monthly_mono: 345800,
          monthly_total: 435300,
          collector_status: "ONLINE",
          last_updated: "2026-08-11 14:28:15",
        },
        {
          id: 3,
          workplace_name: "(주) 한빛 미디어 렌탈사업부",
          owner_name: "이영희 팀장",
          device_count: 6,
          monthly_color: 162900,
          monthly_mono: 420300,
          monthly_total: 583200,
          collector_status: "ONLINE",
          last_updated: "2026-08-11 14:31:10",
        },
        {
          id: 4,
          workplace_name: "미래 사무기기 텍스타일",
          owner_name: "박진우 대표",
          device_count: 3,
          monthly_color: 51050,
          monthly_mono: 214680,
          monthly_total: 265730,
          collector_status: "OFFLINE",
          last_updated: "2026-08-11 10:15:00",
        },
      ];
      setPartners(demoPartners);
      setTotalWorkplacesCount(4);
      setTotalDevicesCount(18);
      setTotalMonthlyColor(418900);
      setTotalMonthlyMono(1280400);
      setLoading(false);
      return;
    }

    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";

    if (token) {
      fetch(`${getApiBaseUrl()}/api/v1/workplace/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.partners)) {
            setPartners(data.partners);
            setTotalWorkplacesCount(data.total_workplaces || data.partners.length);
            setTotalDevicesCount(data.total_devices || 0);
            setTotalMonthlyColor(data.total_color || 0);
            setTotalMonthlyMono(data.total_mono || 0);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333]">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Breadcrumb */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#5C5C5C] tracking-wide uppercase">
            파트너 관리자 › 대시보드
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
            모든 파트너사 관제 및 사용현황 대시보드
          </h1>
          <p className="text-sm text-[#5C5C5C]">
            전국 파트너 사업장별 복합기 가동 현황, 카운터 집계 및 당월 사용량을 통합 관제합니다.
          </p>
        </div>

        {/* 종합 KPI summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
            <div className="text-xs font-bold text-[#5C5C5C]">전체 파트너 사업장</div>
            <div className="text-2xl sm:text-3xl font-black text-[#333333]">
              {loading ? "-" : totalWorkplacesCount} <span className="text-sm font-normal text-slate-500">개사</span>
            </div>
            <div className="text-xs text-emerald-600 font-semibold">전국 통합 관리 파트너</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
            <div className="text-xs font-bold text-[#5C5C5C]">총 관제 등록 복합기</div>
            <div className="text-2xl sm:text-3xl font-black text-[#01916D]">
              {loading ? "-" : totalDevicesCount} <span className="text-sm font-normal text-slate-500">대</span>
            </div>
            <div className="text-xs text-emerald-600 font-semibold">에이전트 수집 가동 기기</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
            <div className="text-xs font-bold text-[#5C5C5C]">당월 전체 컬러 사용량</div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600">
              {loading ? "-" : totalMonthlyColor.toLocaleString()} <span className="text-sm font-normal text-slate-500">매</span>
            </div>
            <div className="text-xs text-rose-500 font-semibold">전체 파트너 컬러 카운트</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
            <div className="text-xs font-bold text-[#5C5C5C]">당월 전체 흑백 사용량</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {loading ? "-" : totalMonthlyMono.toLocaleString()} <span className="text-sm font-normal text-slate-500">매</span>
            </div>
            <div className="text-xs text-slate-500 font-semibold">전체 파트너 흑백 카운트</div>
          </div>
        </div>

        {/* B2B Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#333333]">파트너사별 종합 사용현황 목록</h2>
              <p className="text-xs text-[#5C5C5C] mt-0.5">
                등록된 파트너사별 장비 보유 수 및 당월 컬러/흑백 사용량을 한눈에 확인합니다.
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#01916D]/10 text-[#01916D]">
              실시간 관제 연동
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[#5C5C5C] font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4">파트너 사업장명</th>
                  <th className="p-4">대표자/담당자</th>
                  <th className="p-4 text-center">등록 복합기 수</th>
                  <th className="p-4 text-right">당월 컬러 사용량</th>
                  <th className="p-4 text-right">당월 흑백 사용량</th>
                  <th className="p-4 text-right">당월 총 사용량</th>
                  <th className="p-4 text-center">수집기 상태</th>
                  <th className="p-4 text-center">최근 관제시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#5C5C5C]">
                      파트너사 관제 데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#5C5C5C]">
                      등록된 파트너 사업장이 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  partners.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="p-4 font-bold text-[#333333]">{p.workplace_name}</td>
                      <td className="p-4 text-[#5C5C5C]">{p.owner_name}</td>
                      <td className="p-4 text-center font-bold text-[#01916D]">{p.device_count} 대</td>
                      <td className="p-4 text-right font-semibold text-rose-600">
                        {p.monthly_color.toLocaleString()} 매
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-700">
                        {p.monthly_mono.toLocaleString()} 매
                      </td>
                      <td className="p-4 text-right font-black text-[#333333]">
                        {p.monthly_total.toLocaleString()} 매
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            p.collector_status === "ONLINE"
                              ? "bg-emerald-100 text-[#01916D]"
                              : "bg-rose-100 text-[#E01E35]"
                          }`}
                        >
                          {p.collector_status === "ONLINE" ? "정상 연동" : "연동 미수신"}
                        </span>
                      </td>
                      <td className="p-4 text-center text-xs text-[#5C5C5C]">{p.last_updated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
