"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";
import {
  createPrinterAsset,
  updatePrinterAsset,
  deletePrinterAsset,
  getPrinterAssets,
  PrinterAssetDto,
  formatKoreanDateTime,
} from "../../../../lib/auth-api";

export default function AssetDevicesPage() {
  const [accessToken, setAccessToken] = useState("");
  const [printers, setPrinters] = useState<PrinterAssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State for Manual Device Registration (Create)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields (Create)
  const [serialNo, setSerialNo] = useState("");
  const [modelName, setModelName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [location, setLocation] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  // Modal State for Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<PrinterAssetDto | null>(null);
  const [editSerialNo, setEditSerialNo] = useState("");
  const [editModelName, setEditModelName] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editIpAddress, setEditIpAddress] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Modal State for Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState<PrinterAssetDto | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const isDemo = sessionStorage.getItem("partneron_demo_mode") === "true";
    if (isDemo) {
      loadPrinters("demo-token", false);
      return;
    }

    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);
    if (token) {
      loadPrinters(token, false);
      const intervalId = setInterval(() => {
        loadPrinters(token, true);
      }, 10000);
      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadPrinters(token: string, silent = false) {
    if (!silent) setLoading(true);
    if (!silent) setErrorMsg("");
    if (sessionStorage.getItem("partneron_demo_mode") === "true") {
      setPrinters([
        {
          id: 1,
          serial_no: "FX-9988102",
          model_name: "Fujifilm ApeosPort-VII C3373",
          customer_name: "(주) 글로벌 솔루션 강남점",
          location: "2층 임원실",
          ip_address: "192.168.1.105",
          count_color: 12450,
          count_mono: 84120,
          count_total: 96570,
          last_scanned_at: "2026-08-11T14:30:00Z",
          is_online: true,
        },
        {
          id: 2,
          serial_no: "CN-7738210",
          model_name: "Canon imageRUNNER C5535i",
          customer_name: "삼정 IT 물류 센터",
          location: "1층 창고 데스크",
          ip_address: "192.168.10.40",
          count_color: 45100,
          count_mono: 142800,
          count_total: 187900,
          last_scanned_at: "2026-08-11T14:28:15Z",
          is_online: false,
        },
      ] as any);
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      const data = await getPrinterAssets(token);
      setPrinters(data);
    } catch (err) {
      if (!silent) {
        setErrorMsg(err instanceof Error ? err.message : "복합기 장비 조회를 실패했습니다.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
      setSerialNo("");
      setModelName("");
      setCustomerName("");
      setLocation("");
      setIpAddress("");
      loadPrinters(accessToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : "장비 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenEditModal(p: PrinterAssetDto) {
    setEditingTarget(p);
    setEditSerialNo(p.serial_no);
    setEditModelName(p.model_name);
    setEditCustomerName(p.customer_name);
    setEditLocation(p.location);
    setEditIpAddress(p.ip_address || "");
    setIsEditModalOpen(true);
  }

  async function handleUpdateDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTarget) return;
    if (!editSerialNo.trim()) {
      alert("장비 시리얼 번호는 필수 항목입니다.");
      return;
    }

    try {
      setEditSubmitting(true);
      await updatePrinterAsset(accessToken, editingTarget.id, {
        serial_no: editSerialNo.trim(),
        model_name: editModelName.trim() || "ApeosPort-VII C3373",
        customer_name: editCustomerName.trim() || "자사 본사",
        location: editLocation.trim() || "사무실",
        ip_address: editIpAddress.trim() || undefined,
      });

      alert(`장비 [${editSerialNo}] 정보가 성공적으로 수정되었습니다.`);
      setIsEditModalOpen(false);
      setEditingTarget(null);
      loadPrinters(accessToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : "장비 수정에 실패했습니다.");
    } finally {
      setEditSubmitting(false);
    }
  }

  function handleOpenDeleteModal(p: PrinterAssetDto) {
    setDeletingTarget(p);
    setIsDeleteModalOpen(true);
  }

  async function handleDeleteDevice() {
    if (!deletingTarget) return;

    try {
      setDeleteSubmitting(true);
      await deletePrinterAsset(accessToken, deletingTarget.id);
      alert(`장비 [${deletingTarget.serial_no}]가 삭제되었습니다.`);
      setIsDeleteModalOpen(false);
      setDeletingTarget(null);
      loadPrinters(accessToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : "장비 삭제에 실패했습니다.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>자산/수집</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">장비 현황</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                  등록된 복합기 자산 기기 관리
                </h1>
                <span className="text-xs font-bold text-[#01916D] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#01916D] animate-ping"></span>
                  10초 자동 갱신중
                </span>
              </div>
              <p className="text-sm text-[#5C5C5C] mt-1">
                수동으로 장비 시리얼 번호를 사전 등록하면, 현장 Windows Agent 수집기가 감지 시 실시간으로 매칭되어 모니터링됩니다. <span className="font-bold text-[#01916D]">(3분 주기 생존 관제 적용)</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadPrinters(accessToken, true)}
                disabled={isRefreshing}
                className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                title="페이지 전체 새로고침 없이 백그라운드 데이터만 비동기 갱신합니다."
              >
                <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
                <span>비동기 새로고침</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-3 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>+ 신규 장비 수동 등록</span>
              </button>
            </div>
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
              <span className="text-xs font-bold text-[#01916D] bg-emerald-50 px-2 py-0.5 rounded-full" title="3분 이내 수집 패킷 수신 중">
                실시간 연동중 (3분 주기)
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
              <span className="text-xs font-semibold text-slate-500">대 (3분 이상 무응답)</span>
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
                    <th className="py-3.5 px-6 text-right">상태 (3분 기준)</th>
                    <th className="py-3.5 px-6 text-center">관리 액션</th>
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
                          title={p.is_online ? "최근 3분 이내 수집 패킷 수신 중" : "3분 이상 수집 패킷 미수신 (통신 중단)"}
                        >
                          {p.is_online ? "매칭 및 관제중 (3분 주기)" : "연동 중단 (3분 이상 무응답)"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#01916D]/10 hover:text-[#01916D] text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer border border-slate-200"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(p)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#E01E35] font-bold text-xs rounded-lg transition-all cursor-pointer border border-rose-200"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Manual Device Registration Modal (Create) */}
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

      {/* Device Edit Modal */}
      {isEditModalOpen && editingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-[#333333]">
                  복합기 장비 정보 수정
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  [ID #{editingTarget.id}] {editingTarget.serial_no}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDevice} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  장비 시리얼 번호 (Serial No) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: FX-721495-192168155"
                  value={editSerialNo}
                  onChange={(e) => setEditSerialNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">모델명</label>
                <input
                  type="text"
                  placeholder="예: ApeosPort-VII C3373"
                  value={editModelName}
                  onChange={(e) => setEditModelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">설치 고객사명</label>
                <input
                  type="text"
                  placeholder="예: (주)파트너온 본사"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">설치 위치</label>
                <input
                  type="text"
                  placeholder="예: 2층 경영지원팀"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">기기 IP 주소 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 192.168.1.155"
                  value={editIpAddress}
                  onChange={(e) => setEditIpAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] font-mono text-sm"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editSubmitting ? "수정 중..." : "수정사항 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E01E35]"></span>
                <h3 className="text-xl font-extrabold text-[#333333]">
                  복합기 장비 삭제 확인
                </h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                <p className="font-bold text-sm text-[#E01E35]">
                  경고: 이 장비를 정말 삭제하시겠습니까?
                </p>
                <p>
                  삭제 시 해당 장비의 시리얼 매칭 관제 및 모니터링 데이터 연결이 제거됩니다.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">시리얼 번호:</span>
                  <span className="font-mono font-bold text-[#01916D]">{deletingTarget.serial_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">모델명:</span>
                  <span className="font-bold text-slate-800">{deletingTarget.model_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">설치 고객사:</span>
                  <span className="font-bold text-slate-800">{deletingTarget.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">설치 위치:</span>
                  <span className="font-medium text-slate-700">{deletingTarget.location}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteDevice}
                disabled={deleteSubmitting}
                className="px-5 py-2.5 bg-[#E01E35] hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                {deleteSubmitting ? "삭제 중..." : "확인하여 장비 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
