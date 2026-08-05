"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";
import {
  createPrinterAsset,
  getPrinterAssets,
  PrinterAssetDto,
  formatKoreanDateTime,
} from "../../../../lib/auth-api";

export default function AssetDevicesPage() {
  const [accessToken, setAccessToken] = useState("");
  const [printers, setPrinters] = useState<PrinterAssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State for Manual Device Registration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [serialNo, setSerialNo] = useState("");
  const [modelName, setModelName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [location, setLocation] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);
    if (token) {
      loadPrinters(token);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadPrinters(token: string) {
    try {
      setLoading(true);
      const data = await getPrinterAssets(token);
      setPrinters(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "복합기 장비 조회를 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!serialNo.trim()) {
      alert("장비 시리얼 번호(serial_no)는 필수 항목입니다.");
      return;
    }

    try {
      setSubmitting(true);
      await createPrinterAsset(accessToken, {
        serial_no: serialNo.trim(),
        model_name: modelName.trim() || "ApeosPort-VII C3373",
        customer_name: customerName.trim() || "자사 본사",
        location: location.trim() || "사무실",
        ip_address: ipAddress.trim() || undefined,
      });

      alert(`장비 [${serialNo}]가 수동 등록되었습니다. 현장의 Agent가 이 시리얼 번호를 감지하면 실시간 모니터링이 자동 연결됩니다.`);
      setIsModalOpen(false);
      // Reset form
      setSerialNo("");
      setModelName("");
      setCustomerName("");
      setLocation("");
      setIpAddress("");
      // Reload list
      loadPrinters(accessToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : "장비 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>자산 및 입출고</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">기기 관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                등록된 복합기 자산 기기 관리
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                수동으로 장비 시리얼 번호를 사전 등록하면, 현장 Windows Agent 수집기가 감지 시 실시간으로 매칭되어 모니터링됩니다.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ 신규 장비 수동 등록</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              DB 등록 복합기 자산 총계
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#333333]">{printers.length}</span>
              <span className="text-xs font-semibold text-slate-500">대 등록됨</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Agent 수집 실시간 매칭 기기
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#01916D]">
                {printers.filter((p) => p.is_online).length}
              </span>
              <span className="text-xs font-bold text-[#01916D] bg-emerald-50 px-2 py-0.5 rounded-full">
                실시간 연동중 (ONLINE)
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              수집 중단 / 미감지 장비
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">
                {printers.filter((p) => !p.is_online).length}
              </span>
              <span className="text-xs font-semibold text-slate-500">대</span>
            </div>
          </div>
        </div>

        {/* Device Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#333333]">복합기 장비 자산 목록 (시리얼 매칭 기준)</h2>
            <span className="text-xs font-semibold text-slate-500">PostgreSQL DB 마스터 테이블</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-semibold">
              장비 목록을 불러오는 중입니다...
            </div>
          ) : printers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              등록된 장비가 없습니다. 상단의 `[+ 신규 장비 수동 등록]` 버튼을 눌러 시리얼 번호와 모델을 등록하세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">시리얼 번호 (Serial No)</th>
                    <th className="py-3.5 px-6">모델명</th>
                    <th className="py-3.5 px-6">설치 고객사 / 위치</th>
                    <th className="py-3.5 px-6">IP 주소</th>
                    <th className="py-3.5 px-6 text-right">누적 컬러 카운트</th>
                    <th className="py-3.5 px-6 text-right">누적 흑백 카운트</th>
                    <th className="py-3.5 px-6 text-right">최근 Agent 수집 시각</th>
                    <th className="py-3.5 px-6 text-right">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {printers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#01916D]">
                        {p.serial_no}
                      </td>
                      <td className="py-4 px-6 font-bold text-[#333333]">{p.model_name}</td>
                      <td className="py-4 px-6">
                        <div className="text-slate-800 font-bold">{p.customer_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.location}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">
                        {p.ip_address || "-"}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-[#01916D]">
                        {p.count_color.toLocaleString()} 매
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                        {p.count_mono.toLocaleString()} 매
                      </td>
                      <td className="py-4 px-6 text-right text-xs text-slate-500 font-medium">
                        {formatKoreanDateTime(p.last_scanned_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            p.is_online
                              ? "bg-emerald-100 text-[#01916D]"
                              : "bg-rose-100 text-[#E01E35]"
                          }`}
                        >
                          {p.is_online ? "매칭 및 관제중 (ONLINE)" : "연동 중단 (OFFLINE)"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Manual Device Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-[#333333]">
                신규 복합기 장비 수동 등록
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  장비 시리얼 번호 (Serial No) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: FX-721495-192168155"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] font-mono text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  * Agent SNMP 스캔 시 이 시리얼 번호와 매칭되어 사용량이 자동 동기화됩니다.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">모델명</label>
                <input
                  type="text"
                  placeholder="예: ApeosPort-VII C3373"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">설치 고객사명</label>
                <input
                  type="text"
                  placeholder="예: (주)파트너온 본사"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">설치 위치</label>
                <input
                  type="text"
                  placeholder="예: 2층 경영지원팀"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">기기 IP 주소 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 192.168.1.155"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] font-mono text-sm"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {submitting ? "등록 중..." : "장비 등록 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
