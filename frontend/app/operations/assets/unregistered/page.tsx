"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { getApiBaseUrl } from "../../../../lib/auth-api";

type UnregisteredRecord = {
  id: number;
  ip: string;
  scanned_model: string;
  vendor_name: string;
  mac_address: string;
  serial_no: string;
  confirmed_serial_no: string;
  location: string;
  registered: boolean;
  count_total: number;
  count_color: number;
  count_mono: number;
  toner_k: number;
  toner_c: number;
  toner_m: number;
  toner_y: number;
  last_scanned_at: string;
};

type Stats = {
  total: number;
  pending: number;
  registered: number;
};

export default function UnregisteredPrintersPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, registered: 0 });
  const [records, setRecords] = useState<UnregisteredRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  
  // Registration Modal State
  const [selectedRecord, setSelectedRecord] = useState<UnregisteredRecord | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState<string>("자사 본사");
  const [locationInput, setLocationInput] = useState<string>("사무실");
  const [serialInput, setSerialInput] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token =
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("partneron.accessToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("partneron.accessToken") ||
        "";

      const res = await fetch(`${getApiBaseUrl()}/api/v1/workplace/unregistered-printers/?status=${statusFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || { total: 0, pending: 0, registered: 0 });
        setRecords(data.records || []);
      }
    } catch (e) {
      console.error("Failed to fetch unregistered printers", e);
    } finally {
      setLoading(false);
    }
  };

  const openRegisterModal = (record: UnregisteredRecord) => {
    setSelectedRecord(record);
    setSerialInput(record.confirmed_serial_no !== "-" ? record.confirmed_serial_no : record.serial_no);
    setCustomerNameInput("자사 본사");
    setLocationInput(record.location !== "-" ? record.location : "사무실 1층");
  };

  const handleRegister = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);

    try {
      const token =
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("partneron.accessToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("partneron.accessToken") ||
        "";

      const res = await fetch(`${getApiBaseUrl()}/api/v1/workplace/unregistered-printers/${selectedRecord.id}/register/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerNameInput,
          location: locationInput,
          serial_no: serialInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlertMessage(data.message || "정식 자산으로 승인 등록되었습니다.");
        setSelectedRecord(null);
        fetchData();
        setTimeout(() => setAlertMessage(""), 4000);
      }
    } catch (e) {
      console.error("Failed to register printer", e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader workplaceName="파트너온 본사" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#5C5C5C] space-x-1">
          <span>자산/수집</span>
          <span>&rsaquo;</span>
          <span className="font-semibold text-[#01916D]">미등록 장비 관리</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
              미등록 탐지 복합기 관제 (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm text-[#01916D]">unregistered_printers</code>)
            </h1>
            <p className="text-xs text-[#5C5C5C] mt-1">
              에이전트가 네트워크에서 자동으로 감지한 미등록 복합기 장비를 오염 없이 분리 조회하고, 정식 자산(<code className="bg-slate-100 px-1 py-0.5 rounded">PrinterAsset</code>)으로 이관합니다.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#01916D] hover:bg-[#006449] rounded-xl shadow-sm transition-all"
          >
            새로고침
          </button>
        </div>

        {/* Alert Notification */}
        {alertMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
            ✅ {alertMessage}
          </div>
        )}

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5C5C5C] font-medium">총 스캔 탐지 장비</p>
              <p className="text-2xl font-bold text-[#333333] mt-1">{stats.total} 대</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              전체
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-800 font-medium">신규 미등록 대기</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{stats.pending} 대</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              ⏳ 등록 대기
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-[#01916D] font-medium">정식 자산 등록 완료</p>
              <p className="text-2xl font-bold text-[#01916D] mt-1">{stats.registered} 대</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#01916D]">
              ✅ 등록 완료
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#5C5C5C]">상태 필터:</span>
            {[
              { label: "전체", key: "ALL" },
              { label: "⏳ 미등록 대기", key: "PENDING" },
              { label: "✅ 정식 등록 완료", key: "REGISTERED" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === item.key
                    ? "bg-[#01916D] text-white shadow-sm"
                    : "bg-slate-100 text-[#5C5C5C] hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#5C5C5C] uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3.5">탐지 시각</th>
                  <th className="px-4 py-3.5">스캔 IP</th>
                  <th className="px-4 py-3.5">제조사 / 모델명</th>
                  <th className="px-4 py-3.5">시리얼 번호 / MAC</th>
                  <th className="px-4 py-3.5">탐지 카운터 (컬러/흑백/전체)</th>
                  <th className="px-4 py-3.5">토너 잔량 (K/C/M/Y)</th>
                  <th className="px-4 py-3.5">상태 뱃지</th>
                  <th className="px-4 py-3.5 text-right">정식 승인</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#5C5C5C]">
                      탐지된 미등록 복합기 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#5C5C5C]">
                      현재 수집된 미등록 장비 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#5C5C5C]">{r.last_scanned_at}</td>
                      <td className="px-4 py-3 font-semibold text-[#333333]">{r.ip}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#01916D]">{r.vendor_name}</span>
                        <div className="text-[11px] text-[#5C5C5C]">{r.scanned_model}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] font-semibold text-slate-700">{r.serial_no}</div>
                        <div className="font-mono text-[10px] text-slate-400">{r.mac_address}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                        C: <span className="text-[#01916D] font-semibold">{r.count_color?.toLocaleString() || 0}</span> / M:{" "}
                        <span className="font-semibold">{r.count_mono?.toLocaleString() || 0}</span> / T:{" "}
                        <span className="font-bold text-slate-900">{r.count_total?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] space-x-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold">K:{r.toner_k}%</span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">C:{r.toner_c}%</span>
                        <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 text-[10px] font-bold">M:{r.toner_m}%</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Y:{r.toner_y}%</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.registered ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-[#01916D]">
                            ✅ 정식 등록 완료
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            ⏳ 미등록 대기
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={r.registered}
                          onClick={() => openRegisterModal(r)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#01916D] hover:bg-[#006449] shadow-sm transition-all disabled:opacity-40"
                        >
                          {r.registered ? "등록됨" : "🚀 정식 등록"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PrinterRegisterModal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#333333]">
                    정식 복합기 자산(PrinterAsset) 승인 등록
                  </h2>
                  <p className="text-xs text-[#5C5C5C]">
                    IP {selectedRecord.ip} ({selectedRecord.vendor_name} - {selectedRecord.scanned_model})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#5C5C5C] font-semibold mb-1">시리얼 번호</label>
                  <input
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#01916D] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#5C5C5C] font-semibold mb-1">설치 고객사명</label>
                  <input
                    type="text"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    placeholder="예: 자사 본사 또는 ABC상사"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#01916D]"
                  />
                </div>

                <div>
                  <label className="block text-[#5C5C5C] font-semibold mb-1">설치 위치</label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="예: 사무실 1층 로비"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#01916D]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 rounded-xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs transition-all"
                >
                  취소
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleRegister}
                  className="px-5 py-2 rounded-xl font-semibold text-white bg-[#01916D] hover:bg-[#006449] shadow-md text-xs transition-all disabled:opacity-50"
                >
                  🚀 정식 복합기 자산으로 등록
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
