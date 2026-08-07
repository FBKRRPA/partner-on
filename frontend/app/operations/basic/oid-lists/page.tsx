"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { getApiBaseUrl } from "../../../../lib/auth-api";

type TempOidRecord = {
  id: number;
  manufacturer: string;
  printer_model: string;
  scanned_ip: string;
  serial_no: string;
  count1: string;
  count2: string;
  count4: string;
  toner_c: string;
  toner_m: string;
  toner_y: string;
  toner_k: string;
  drum_k: string;
  raw_walk_dump: Record<string, any>;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  created_at: string;
};

type OidStats = {
  total: number;
  pending: number;
  confirmed: number;
};

export default function OidInspectionPage() {
  const [stats, setStats] = useState<OidStats>({ total: 0, pending: 0, confirmed: 0 });
  const [records, setRecords] = useState<TempOidRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<TempOidRecord | null>(null);
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

      const res = await fetch(`${getApiBaseUrl()}/api/v1/workplace/oid-inspection/?status=${statusFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || { total: 0, pending: 0, confirmed: 0 });
        setRecords(data.records || []);
      }
    } catch (e) {
      console.error("Failed to fetch OID inspection data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setActionLoading(true);
    try {
      const token =
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("partneron.accessToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("partneron.accessToken") ||
        "";

      const res = await fetch(`${getApiBaseUrl()}/api/v1/workplace/oid-inspection/${id}/${action}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAlertMessage(data.message || "처리가 완료되었습니다.");
        setSelectedRecord(null);
        fetchData();
        setTimeout(() => setAlertMessage(""), 4000);
      }
    } catch (e) {
      console.error(e);
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
          <span>기능관리</span>
          <span>&rsaquo;</span>
          <span className="font-semibold text-[#01916D]">OID 검증 및 승인</span>
        </nav>

        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
              OID 검증 및 승인 관리
            </h1>
            <p className="text-xs text-[#5C5C5C] mt-1">
              검색 에이전트가 탐지한 OID 덤프 데이터를 사람이 눈으로 대조하고 정식 마스터 DB(<code className="bg-slate-100 px-1 py-0.5 rounded">oid_lists</code>)로 승인 이관합니다.
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

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5C5C5C] font-medium">총 스캔 덤프 건수</p>
              <p className="text-2xl font-bold text-[#333333] mt-1">{stats.total} 건</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              전체
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-800 font-medium">승인 대기중 (PENDING)</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{stats.pending} 건</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              ⏳ 검증 대기
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-[#01916D] font-medium">정식 마스터 이관 완료</p>
              <p className="text-2xl font-bold text-[#01916D] mt-1">{stats.confirmed} 건</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#01916D]">
              ✅ 이관 완료
            </span>
          </div>
        </div>

        {/* Filter Control Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#5C5C5C]">상태 필터:</span>
            {["ALL", "PENDING", "CONFIRMED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === st
                    ? "bg-[#01916D] text-white shadow-sm"
                    : "bg-slate-100 text-[#5C5C5C] hover:bg-slate-200"
                }`}
              >
                {st === "ALL" ? "전체" : st === "PENDING" ? "⏳ 검증 대기" : st === "CONFIRMED" ? "✅ 이관 완료" : "❌ 거절됨"}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#5C5C5C] uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3.5">스캔 시각</th>
                  <th className="px-4 py-3.5">스캔 IP</th>
                  <th className="px-4 py-3.5">제조사 / 모델명</th>
                  <th className="px-4 py-3.5">시리얼 OID 후보</th>
                  <th className="px-4 py-3.5">컬러/흑백 카운터 OID</th>
                  <th className="px-4 py-3.5">상태 뱃지</th>
                  <th className="px-4 py-3.5 text-right">대조 & 승인</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#5C5C5C]">
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#5C5C5C]">
                      탐지된 임시 OID 덤프 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#5C5C5C]">{r.created_at}</td>
                      <td className="px-4 py-3 font-semibold text-[#333333]">{r.scanned_ip}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#01916D]">{r.manufacturer}</span>
                        <div className="text-[11px] text-[#5C5C5C]">{r.printer_model}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{r.serial_no}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        C: {r.count1} / M: {r.count2}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "PENDING" && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            ⏳ 검증 대기
                          </span>
                        )}
                        {r.status === "CONFIRMED" && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-[#01916D]">
                            ✅ 이관 완료
                          </span>
                        )}
                        {r.status === "REJECTED" && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-[#E01E35]">
                            ❌ 거절됨
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="px-3 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                        >
                          대조 & 검증
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* OidInspectionModal (Visual Inspection & Master Promotion Modal) */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#333333]">
                    OID 세부 대조 및 마스터 승인
                  </h2>
                  <p className="text-xs text-[#5C5C5C]">
                    IP {selectedRecord.scanned_ip} ({selectedRecord.manufacturer} - {selectedRecord.printer_model})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {/* OID Candidates List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-[#01916D]">시리얼번호 OID:</span>
                  <div className="font-mono text-[11px] text-slate-700 break-all">{selectedRecord.serial_no}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-[#01916D]">컬러 카운터 OID (count1):</span>
                  <div className="font-mono text-[11px] text-slate-700 break-all">{selectedRecord.count1}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-[#01916D]">흑백 카운터 OID (count2):</span>
                  <div className="font-mono text-[11px] text-slate-700 break-all">{selectedRecord.count2}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-[#01916D]">전체 카운터 OID (count4):</span>
                  <div className="font-mono text-[11px] text-slate-700 break-all">{selectedRecord.count4}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-[#01916D]">토너 C / M / Y / K OID:</span>
                  <div className="font-mono text-[11px] text-slate-700 break-all">
                    {selectedRecord.toner_c} / {selectedRecord.toner_k}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-semibold text-[#01916D]">드럼 K OID:</span>
                  <div className="font-mono text-[11px] text-slate-700 break-all">{selectedRecord.drum_k}</div>
                </div>
              </div>

              {/* Raw Walk Tree Json Preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#333333]">Raw MIB Walk Tree 덤프:</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono max-h-40 overflow-y-auto">
                  {JSON.stringify(selectedRecord.raw_walk_dump, null, 2)}
                </pre>
              </div>

              {/* Actions Button Bar */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedRecord.id, "reject")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-[#E01E35] hover:bg-rose-100 border border-rose-200 transition-all"
                >
                  ❌ 거절 (Reject)
                </button>

                <button
                  disabled={actionLoading || selectedRecord.status === "CONFIRMED"}
                  onClick={() => handleAction(selectedRecord.id, "approve")}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#01916D] hover:bg-[#006449] shadow-md transition-all disabled:opacity-50"
                >
                  🚀 정식 마스터 OID 이관 (Promote to oid_lists)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
