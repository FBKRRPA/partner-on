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

  // Selected Device State for Detail Modal Inspection
  const [selectedDeviceModal, setSelectedDeviceModal] = useState<MonitoringUsageDto | null>(null);

  // Filters State
  const [selectedSerial, setSelectedSerial] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    const isDemo = sessionStorage.getItem("partneron_demo_mode") === "true";
    if (isDemo) {
      setUsageList([
        {
          id: 1,
          serial_no: "FX-9988102",
          model_name: "Fujifilm ApeosPort-VII C3373",
          customer_name: "(주) 글로벌 솔루션 강남점",
          location: "2층 임원실",
          count_total: 96570,
          count_color: 12450,
          count_mono: 84120,
          count_scan: 18450,
          count_fax: 1200,
          monthly_usage_color: 800,
          monthly_usage_mono: 3200,
          last_scanned_at: "2026-08-11T14:30:00Z",
          agent_updated_at: "2026-08-11T14:30:00Z",
        },
        {
          id: 2,
          serial_no: "CN-7738210",
          model_name: "Canon imageRUNNER C5535i",
          customer_name: "삼정 IT 물류 센터",
          location: "1층 창고 데스크",
          count_total: 187900,
          count_color: 45100,
          count_mono: 142800,
          count_scan: 45000,
          count_fax: 3100,
          monthly_usage_color: 2500,
          monthly_usage_mono: 9500,
          last_scanned_at: "2026-08-11T14:28:15Z",
          agent_updated_at: "2026-08-11T14:28:15Z",
        },
      ] as any);
      setHistoryList([
        {
          id: 101,
          serial_no: "FX-9988102",
          model_name: "Fujifilm ApeosPort-VII C3373",
          customer_name: "(주) 글로벌 솔루션 강남점",
          location: "2층 임원실",
          yyyymmdd: "20260811",
          date_formatted: "2026-08-11",
          count_color: 12450,
          count_mono: 84120,
          count_total: 96570,
          daily_color: 80,
          daily_mono: 370,
          daily_scan: 120,
          agent_updated_at: "2026-08-11T14:30:00Z",
        },
        {
          id: 102,
          serial_no: "CN-7738210",
          model_name: "Canon imageRUNNER C5535i",
          customer_name: "삼정 IT 물류 센터",
          location: "1층 창고 데스크",
          yyyymmdd: "20260811",
          date_formatted: "2026-08-11",
          count_color: 45100,
          count_mono: 142800,
          count_total: 187900,
          daily_color: 350,
          daily_mono: 850,
          daily_scan: 400,
          agent_updated_at: "2026-08-11T14:28:15Z",
        },
      ] as any);
      setTotalRecordsCount(2);
      setLoading(false);
      return;
    }

    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    if (token) {
      setLoading(true);
      getMonitoringUsage(token, startDate, endDate, selectedSerial)
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
  }, [startDate, endDate, selectedSerial]);

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
                      <th className="py-3.5 px-6">고객사명 / 설치 위치</th>
                      <th className="py-3.5 px-6">수집 일자 (YYYY-MM-DD)</th>
                      <th className="py-3.5 px-6">장비 시리얼 번호 / 모델명</th>
                      <th className="py-3.5 px-6 text-right">누적 컬러 카운트</th>
                      <th className="py-3.5 px-6 text-right">누적 흑백 카운트</th>
                      <th className="py-3.5 px-6 text-right">누적 전체 카운트</th>
                      <th className="py-3.5 px-6 text-right">Agent 데이터 수집 시각</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredHistory.map((item) => {
                      const deviceObj = usageList.find((d) => d.serial_no === item.serial_no) || {
                        id: item.id,
                        customer_name: item.customer_name || "자사 본사",
                        serial_no: item.serial_no,
                        model_name: item.model_name,
                        location: item.location || "사무실",
                        count_color: item.count_color,
                        count_mono: item.count_mono,
                        count_large_color: 0,
                        count_total: item.count_total,
                        monthly_usage_color: 0,
                        monthly_usage_mono: 0,
                        last_updated_at: item.agent_updated_at,
                      };
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedDeviceModal(deviceObj)}
                          className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6">
                            <span className="inline-block px-2.5 py-0.5 bg-[#01916D]/10 text-[#01916D] font-bold text-xs rounded-full mb-0.5">
                              {item.customer_name || "자사 본사"}
                            </span>
                            <div className="text-xs text-slate-500">{item.location || "사무실"}</div>
                          </td>
                          <td className="py-4 px-6 font-mono font-extrabold text-[#01916D]">
                            {item.date_formatted}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-mono text-xs font-bold text-slate-800">{item.serial_no}</div>
                            <div className="text-xs text-slate-500">{item.model_name}</div>
                          </td>
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
                      );
                    })}
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
                      <tr
                        key={item.id}
                        onClick={() => setSelectedDeviceModal(item)}
                        className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-0.5 bg-[#01916D]/10 text-[#01916D] font-bold text-xs rounded-full mb-0.5">
                            {item.customer_name}
                          </span>
                          <div className="text-xs text-slate-500 font-medium">{item.location}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-mono text-xs font-bold text-slate-800">{item.serial_no}</div>
                          <div className="text-xs text-slate-500 font-medium">{item.model_name}</div>
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

      {/* Device Detail Inspection Modal */}
      {selectedDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedDeviceModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-[#01916D]/10 text-[#01916D] font-black text-xs rounded-full">
                {selectedDeviceModal.customer_name}
              </span>
              <span className="text-xs text-slate-400 font-bold">•</span>
              <span className="text-xs text-slate-600 font-bold">{selectedDeviceModal.location}</span>
            </div>

            <h2 className="text-xl font-black text-[#333333] mb-1">
              {selectedDeviceModal.model_name}
            </h2>
            <div className="font-mono text-xs text-slate-500 font-extrabold mb-6">
              시리얼 번호: <span className="text-[#01916D]">{selectedDeviceModal.serial_no}</span>
            </div>

            {/* Counter Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-center p-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">컬러 카운트</span>
                <span className="text-base font-black text-[#01916D] font-mono">
                  {selectedDeviceModal.count_color.toLocaleString()}
                </span>
              </div>
              <div className="text-center p-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">흑백 카운트</span>
                <span className="text-base font-black text-slate-800 font-mono">
                  {selectedDeviceModal.count_mono.toLocaleString()}
                </span>
              </div>
              <div className="text-center p-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">당월 컬러</span>
                <span className="text-base font-black text-[#01916D] font-mono">
                  +{selectedDeviceModal.monthly_usage_color.toLocaleString()}
                </span>
              </div>
              <div className="text-center p-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">당월 흑백</span>
                <span className="text-base font-black text-slate-700 font-mono">
                  +{selectedDeviceModal.monthly_usage_mono.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Counter & Agent Status */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="font-bold text-[#01916D]">누적 총 매수 (Total Pages)</span>
                <span className="font-black font-mono text-sm text-[#01916D]">
                  {selectedDeviceModal.count_total.toLocaleString()} 매
                </span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-slate-100/70 rounded-xl">
                <span className="font-bold text-slate-600">Agent 수집 시각</span>
                <span className="font-medium font-mono text-slate-700">
                  {formatKoreanDateTime(selectedDeviceModal.last_updated_at)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDeviceModal(null)}
                className="px-5 py-2.5 bg-[#01916D] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#006449] transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
