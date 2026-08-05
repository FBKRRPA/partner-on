"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";
import { getMonitoringUsage, MonitoringUsageDto } from "../../../../lib/auth-api";

export default function MonitoringUsagePage() {
  const [usageList, setUsageList] = useState<MonitoringUsageDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    if (token) {
      getMonitoringUsage(token)
        .then(setUsageList)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const totalColor = usageList.reduce((acc, curr) => acc + curr.monthly_usage_color, 0);
  const totalMono = usageList.reduce((acc, curr) => acc + curr.monthly_usage_mono, 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>모니터링</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">카운터 사용량 현황</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
            복합기 카운터 사용량 현황
          </h1>
          <p className="text-sm text-[#5C5C5C] mt-1">
            SNMP 및 이메일 수신기로 자동 수집된 기기별 컬러·흑백 누적 카운터 및 당월 사용량을 모니터링합니다.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              수집 모니터링 기기 총계
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#333333]">{usageList.length}</span>
              <span className="text-xs font-semibold text-slate-500">대 운용 중</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              당월 총 컬러 사용량
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#01916D]">{totalColor.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">매</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              당월 총 흑백 사용량
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{totalMono.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">매</span>
            </div>
          </div>
        </div>

        {/* Usage Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#333333]">기기별 누적 카운터 및 당월 사용량</h2>
            <span className="text-xs font-semibold text-slate-500">SNMP v2c / SMTP 실시간 수집 데이터</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-semibold">
              사용량 데이터를 불러오는 중입니다...
            </div>
          ) : usageList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              수집된 카운터 사용량 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">고객사명 / 설치 위치</th>
                    <th className="py-3.5 px-6">시리얼 번호 / 모델명</th>
                    <th className="py-3.5 px-6 text-right">컬러 카운트</th>
                    <th className="py-3.5 px-6 text-right">흑백 카운트</th>
                    <th className="py-3.5 px-6 text-right">전체 카운트</th>
                    <th className="py-3.5 px-6 text-right">당월 컬러 사용</th>
                    <th className="py-3.5 px-6 text-right">당월 흑백 사용</th>
                    <th className="py-3.5 px-6 text-right">최근 수집시각</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {usageList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#333333]">{item.customer_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.location}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-xs font-bold text-slate-800">{item.serial_no}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.model_name}</div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-[#01916D]">
                        {item.count_color.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                        {item.count_mono.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-black text-[#333333]">
                        {item.count_total.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="px-2.5 py-1 bg-emerald-50 text-[#01916D] font-mono font-bold text-xs rounded-lg">
                          +{item.monthly_usage_color.toLocaleString()} 매
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono font-bold text-xs rounded-lg">
                          +{item.monthly_usage_mono.toLocaleString()} 매
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-xs text-slate-500">
                        {item.last_updated_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
