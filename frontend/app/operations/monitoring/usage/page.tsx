"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";
import {
  getMonitoringUsage,
  MonitoringUsageDto,
  MonitoringUsageRecordDto,
  formatKoreanDateTime,
} from "../../../../lib/auth-api";

export default function MonitoringUsagePage() {
  const [usageList, setUsageList] = useState<MonitoringUsageDto[]>([]);
  const [historyList, setHistoryList] = useState<MonitoringUsageRecordDto[]>([]);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"SNAPSHOT" | "HISTORY">("HISTORY");

  // Filters State
  const [selectedSerial, setSelectedSerial] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    if (token) {
      getMonitoringUsage(token)
        .then((res) => {
          setUsageList(res.devices || []);
          setHistoryList(res.history || []);
          setTotalRecordsCount(res.total_records_count || 0);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Filter Options matched by serial_no
  const deviceOptions = usageList.map((u) => ({
    serial_no: u.serial_no,
    label: `${u.model_name} (${u.serial_no})`,
  }));

  const filteredHistory = historyList.filter((item) => {
    if (selectedSerial !== "ALL" && item.serial_no !== selectedSerial) return false;
    if (startDate && item.date_formatted < startDate) return false;
    if (endDate && item.date_formatted > endDate) return false;
    return true;
  });

  const filteredDevices = usageList.filter((item) => {
    if (selectedSerial !== "ALL" && item.serial_no !== selectedSerial) return false;
    return true;
  });

  const totalColor = filteredDevices.reduce((acc, curr) => acc + curr.monthly_usage_color, 0);
  const totalMono = filteredDevices.reduce((acc, curr) => acc + curr.monthly_usage_mono, 0);

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                복합기 카운터 사용량 및 일자별 누적 이력
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                SNMP 및 Agent 수집기가 데이터베이스<span className="font-mono text-xs text-[#01916D] font-bold"> (MonitoringDataRecord)</span>에 축적한 과거 일자별 시계열 이력을 관제합니다.
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
                일자별 누적 이력 ({filteredHistory.length}건)
              </button>
              <button
                onClick={() => setActiveTab("SNAPSHOT")}
                className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  activeTab === "SNAPSHOT"
                    ? "bg-[#01916D] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                기기별 최신 스냅샷
              </button>
            </div>
          </div>
        </div>

        {/* Filter Control Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Model Name Select Filter (Bound to serial_no) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-extrabold text-slate-600">복합기 모델명:</label>
              <select
                value={selectedSerial}
                onChange={(e) => setSelectedSerial(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#01916D]"
              >
                <option value="ALL">전체 등록 장비 ({deviceOptions.length}대)</option>
                {deviceOptions.map((opt) => (
                  <option key={opt.serial_no} value={opt.serial_no}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Period Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-extrabold text-slate-600">수집 기간:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#01916D]"
              />
              <span className="text-xs text-slate-400 font-bold">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#01916D]"
              />
            </div>
          </div>

          {(selectedSerial !== "ALL" || startDate || endDate) && (
            <button
              onClick={() => {
                setSelectedSerial("ALL");
                setStartDate("");
                setEndDate("");
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 self-start md:self-auto"
            >
              <span>🔄 필터 초기화</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
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

        {/* TAB 1: Time-Series Accumulated History Table */}
        {activeTab === "HISTORY" ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#333333]">
                과거부터 오늘까지의 일자별 수집 누적 이력 전체 목록
              </h2>
              <span className="text-xs font-bold text-[#01916D] bg-emerald-50 px-2.5 py-1 rounded-full">
                MonitoringDataRecord 마스터
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-semibold">
                시계열 이력 데이터를 불러오는 중입니다...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                조건에 일치하는 시계열 이력 데이터가 없습니다. (필터 조건을 확인하세요)
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">수집 일자 (YYYY-MM-DD)</th>
                      <th className="py-3.5 px-6">장비 시리얼 번호</th>
                      <th className="py-3.5 px-6">모델명</th>
                      <th className="py-3.5 px-6 text-right">누적 컬러 카운트</th>
                      <th className="py-3.5 px-6 text-right">누적 흑백 카운트</th>
                      <th className="py-3.5 px-6 text-right">누적 전체 카운트</th>
                      <th className="py-3.5 px-6 text-right">Agent 데이터 수집 시각</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-mono font-extrabold text-[#01916D]">
                          {item.date_formatted}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-800">
                          {item.serial_no}
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-bold">{item.model_name}</td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-[#01916D]">
                          {item.count_color.toLocaleString()} 매
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                          {item.count_mono.toLocaleString()} 매
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-black text-[#333333]">
                          {item.count_total.toLocaleString()} 매
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
          /* TAB 2: Device Current Snapshots */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#333333]">기기별 최신 수집 카운터 및 당월 사용량 스냅샷</h2>
              <span className="text-xs font-semibold text-slate-500">PrinterAsset 마스터</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-semibold">
                사용량 데이터를 불러오는 중입니다...
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                조건에 일치하는 기기 스냅샷 데이터가 없습니다.
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
                    {filteredDevices.map((item) => (
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
