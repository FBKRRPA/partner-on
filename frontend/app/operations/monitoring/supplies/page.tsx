"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";
import {
  getMonitoringSupplies,
  MonitoringSupplyDto,
  MonitoringSupplyRecordDto,
  formatKoreanDateTime,
} from "../../../../lib/auth-api";

export default function MonitoringSuppliesPage() {
  const [suppliesList, setSuppliesList] = useState<MonitoringSupplyDto[]>([]);
  const [historyList, setHistoryList] = useState<MonitoringSupplyRecordDto[]>([]);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"SNAPSHOT" | "HISTORY">("HISTORY");

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    if (token) {
      getMonitoringSupplies(token)
        .then((res) => {
          setSuppliesList(res.devices || []);
          setHistoryList(res.history || []);
          setTotalRecordsCount(res.total_records_count || 0);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const criticalCount = suppliesList.filter((s) => s.status_alert === "CRITICAL").length;
  const warningCount = suppliesList.filter((s) => s.status_alert === "WARNING").length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>모니터링</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">소모품 잔량 현황</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                토너 및 소모품 잔량 및 일자별 소진 이력
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                기기별 시안(C), 마젠타(M), 옐로(Y), 블랙(K) 토너 잔량 및 데이터베이스<span className="font-mono text-xs text-[#01916D] font-bold"> (MonitoringDataRecord)</span> 일자별 소진 추이를 관제합니다.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("HISTORY")}
                className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  activeTab === "HISTORY"
                    ? "bg-[#01916D] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                소모품 소진 이력 ({totalRecordsCount}건)
              </button>
              <button
                onClick={() => setActiveTab("SNAPSHOT")}
                className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  activeTab === "SNAPSHOT"
                    ? "bg-[#01916D] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                기기별 최신 잔량 스냅샷
              </button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              DB 누적 수집 이력 총계
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#01916D]">{totalRecordsCount.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">건 시계열 저장됨</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              즉시 교체 필요 (5% 미만)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#E01E35]">{criticalCount}</span>
              <span className="text-xs font-bold text-[#E01E35] bg-rose-50 px-2 py-0.5 rounded-full">
                CRITICAL (위험)
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              교체 준비 (15% 이하)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">{warningCount}</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                WARNING (주의)
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: Time-Series Supplies Depletion History Table */}
        {activeTab === "HISTORY" ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#333333]">
                과거부터 오늘까지의 일자별 소모품 잔량 소진 이력 전체 목록 (PostgreSQL DB 시계열 데이터)
              </h2>
              <span className="text-xs font-bold text-[#01916D] bg-emerald-50 px-2.5 py-1 rounded-full">
                MonitoringDataRecord 마스터
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-semibold">
                소모품 이력 데이터를 불러오는 중입니다...
              </div>
            ) : historyList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                누적 수집된 소모품 이력 데이터가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">수집 일자 (YYYY-MM-DD)</th>
                      <th className="py-3.5 px-6">장비 시리얼 번호</th>
                      <th className="py-3.5 px-6 w-64">토너 잔량 (C / M / Y / K)</th>
                      <th className="py-3.5 px-6">드럼(K)</th>
                      <th className="py-3.5 px-6 text-right">Agent 데이터 수집 시각</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {historyList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-mono font-extrabold text-[#01916D]">
                          {item.date_formatted}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-800">
                          {item.serial_no}
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1 text-xs font-mono">
                            <span className="text-cyan-600 font-bold mr-2">C:{item.toner_c}%</span>
                            <span className="text-pink-600 font-bold mr-2">M:{item.toner_m}%</span>
                            <span className="text-amber-500 font-bold mr-2">Y:{item.toner_y}%</span>
                            <span className="text-slate-800 font-bold">K:{item.toner_k}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-800">
                          {item.drum_k}%
                        </td>
                        <td className="py-4 px-6 text-right text-xs text-slate-500 font-medium">
                          {formatKoreanDateTime(item.agent_updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: Device Supplies Current Snapshots */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#333333]">토너 & 드럼 잔량 최신 스냅샷 목록</h2>
              <span className="text-xs font-semibold text-slate-500">PrinterAsset 마스터</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-semibold">
                소모품 현황 데이터를 불러오는 중입니다...
              </div>
            ) : suppliesList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                소모품 모니터링 데이터가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">고객사 / 설치 위치</th>
                      <th className="py-3.5 px-6">시리얼 번호 / 모델명</th>
                      <th className="py-3.5 px-6 w-64">토너 잔량 (C / M / Y / K)</th>
                      <th className="py-3.5 px-6">드럼(K)</th>
                      <th className="py-3.5 px-6">상태 및 알림 메시지</th>
                      <th className="py-3.5 px-6 text-right">최근 수집시각</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {suppliesList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-[#333333]">{item.customer_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.location}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-mono text-xs font-bold text-slate-800">{item.serial_no}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.model_name}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <span className="w-4 font-bold text-cyan-600">C:</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${item.toner_c}%` }} />
                              </div>
                              <span className="w-8 text-right font-bold text-slate-700">{item.toner_c}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 font-bold text-pink-600">M:</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${item.toner_m}%` }} />
                              </div>
                              <span className="w-8 text-right font-bold text-slate-700">{item.toner_m}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 font-bold text-amber-500">Y:</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${item.toner_y}%` }} />
                              </div>
                              <span className="w-8 text-right font-bold text-slate-700">{item.toner_y}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 font-bold text-slate-800">K:</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-slate-800 h-2 rounded-full" style={{ width: `${item.toner_k}%` }} />
                              </div>
                              <span className="w-8 text-right font-bold text-slate-700">{item.toner_k}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-800">
                          {item.drum_k}%
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                item.status_alert === "CRITICAL"
                                  ? "bg-rose-100 text-[#E01E35]"
                                  : item.status_alert === "WARNING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-[#01916D]"
                              }`}
                            >
                              {item.status_alert}
                            </span>
                            <span className="text-xs text-slate-700 font-semibold">{item.alert_message}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-xs text-slate-500 font-medium">
                          {formatKoreanDateTime(item.last_updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
