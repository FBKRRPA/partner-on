"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";
import { CollectorDto, generateAgentCode, getCollectors, formatKoreanDateTime } from "../../../../lib/auth-api";

export default function AgentCollectorsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [collectors, setCollectors] = useState<CollectorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [guideTab, setGuideTab] = useState<"CODE" | "GUIDE">("CODE");

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);
    if (token) {
      loadCollectors(token, false);
      const intervalId = setInterval(() => {
        loadCollectors(token, true);
      }, 10000);
      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadCollectors(token: string, isSilent = false) {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);
      const data = await getCollectors(token);
      setCollectors(data);
    } catch (err) {
      if (!isSilent) {
        setMessage(err instanceof Error ? err.message : "수집기 목록 조회를 실패했습니다.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  async function handleGenerateCode() {
    try {
      setGenerating(true);
      setCopySuccess(false);
      const res = await generateAgentCode(accessToken);
      setGeneratedCode(res.auth_code);
      setIsModalOpen(true);
      setGuideTab("CODE");
    } catch (err) {
      alert(err instanceof Error ? err.message : "코드 발급 실패");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyCode() {
    if (!generatedCode) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedCode);
      } else {
        // Fallback for non-HTTPS / IP address origins
        const textArea = document.createElement("textarea");
        textArea.value = generatedCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error("Failed to copy auth code:", err);
      alert(`[인증 코드: ${generatedCode}]\n클립보드 자동 복사에 실패하여 화면의 코드를 수동으로 복사해 주세요.`);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Title Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>자산 및 입출고</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">수집기/에이전트 관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                  Windows Agent 수집기 관리
                </h1>
                <span className="text-xs font-bold text-[#01916D] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#01916D] animate-ping"></span>
                  10초 자동 갱신중
                </span>
              </div>
              <p className="text-sm text-[#5C5C5C] mt-1">
                현장 LAN 망에서 복합기 SNMP 카운터를 수집하는 상주형 수집기 인증 및 상태 현황을 관제합니다.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadCollectors(accessToken, true)}
                disabled={isRefreshing}
                className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                title="페이지 전체 새로고침 없이 백그라운드 데이터만 비동기 갱신합니다."
              >
                <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
                <span>비동기 새로고침</span>
              </button>

              <button
                onClick={handleGenerateCode}
                disabled={generating}
                className="px-5 py-3 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>+ 신규 Agent 인증 코드 발급</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              등록된 수집기 총계
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#333333]">{collectors.length}</span>
              <span className="text-xs font-semibold text-slate-500">개 대리점/지점</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              실시간 온라인 상태
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#01916D]">
                {collectors.filter((c) => c.status === "ONLINE").length}
              </span>
              <span className="text-xs font-bold text-[#01916D] bg-emerald-50 px-2 py-0.5 rounded-full">
                정상 동작 중
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              자동 모니터링 기기 총계
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#333333]">
                {collectors.reduce((acc, curr) => acc + curr.detected_count, 0)}
              </span>
              <span className="text-xs font-semibold text-slate-500">대 탐지/수집</span>
            </div>
          </div>
        </div>

        {/* Agent List Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#333333]">설치된 수집기 관제 목록</h2>
            <span className="text-xs font-semibold text-slate-500">
              SNMP v2c / HTTPS 암호화 연동
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-semibold">
              수집기 현황 로딩 중...
            </div>
          ) : collectors.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              등록된 수집기가 없습니다. 상단의 `[+ 신규 Agent 인증 코드 발급]` 버튼을 눌러 새 에이전트를 등록하세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">수집기 명칭</th>
                    <th className="py-3.5 px-6">설치 고객사</th>
                    <th className="py-3.5 px-6">스캔 IP 대역</th>
                    <th className="py-3.5 px-6">수동 지정 IP</th>
                    <th className="py-3.5 px-6">탐지 기기 수</th>
                    <th className="py-3.5 px-6">최근 수집 시각</th>
                    <th className="py-3.5 px-6 text-right">상태 (3분 기준)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {collectors.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-[#333333]">{c.name}</td>
                      <td className="py-4 px-6 text-slate-600">{c.customer_name}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">{c.ip_range}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                        {c.custom_ips.length > 0 ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {c.custom_ips.join(", ")}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-[#333333]">{c.detected_count}대</td>
                      <td className="py-4 px-6 text-slate-500 text-xs font-medium">{formatKoreanDateTime(c.last_scanned_at)}</td>
                      <td className="py-4 px-6 text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            c.status === "ONLINE"
                              ? "bg-emerald-100 text-[#01916D]"
                              : "bg-rose-100 text-[#E01E35]"
                          }`}
                          title={c.status === "ONLINE" ? "최근 3분 이내 수집 패킷 수신 중" : "3분 이상 수집 통신 중단"}
                        >
                          {c.status === "ONLINE" ? "ONLINE (3분 주기 수집중)" : "OFFLINE (3분 이상 통신중단)"}
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

      {/* Auth Code Generation & Guide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-[#333333]">
                  Agent 수집기 인증 코드 발급
                </h3>
                <p className="text-xs text-[#5C5C5C] mt-1">
                  현장 Windows PC에 설치된 Agent 프로그램에 8자리 코드를 입력하세요.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => setGuideTab("CODE")}
                className={`flex-1 py-2.5 text-center font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                  guideTab === "CODE"
                    ? "border-[#01916D] text-[#01916D]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                발급된 인증 코드
              </button>
              <button
                type="button"
                onClick={() => setGuideTab("GUIDE")}
                className={`flex-1 py-2.5 text-center font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                  guideTab === "GUIDE"
                    ? "border-[#01916D] text-[#01916D]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                설치 및 차단 대응 안내
              </button>
            </div>

            {guideTab === "CODE" ? (
              <div className="space-y-5">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    8자리 수집기 인증 코드 (24시간 유효)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-[#01916D] mb-4">
                    {generatedCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className={`w-full py-3 px-4 font-extrabold text-sm rounded-xl transition-all cursor-pointer ${
                      copySuccess
                        ? "bg-emerald-600 text-white"
                        : "bg-[#01916D] hover:bg-[#006449] text-white"
                    }`}
                  >
                    {copySuccess ? "코드가 복사되었습니다!" : "인증 코드 복사하기"}
                  </button>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong className="block font-bold mb-1">안내:</strong>
                  현장 Windows PC에서 <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">PartneronAgent.exe</code> 실행 시 위 8자리 코드를 입력하면 안전하게 암호화 연동됩니다.
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-80 overflow-y-auto pr-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="block font-bold text-[#333333] mb-1">
                    1. Chrome 브라우저 다운로드 차단 시
                  </strong>
                  다운로드 창 우측 <strong>[위험한 파일 다운로드 유지]</strong> ➔ <strong>[계속 다운로드]</strong> 선택.
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="block font-bold text-[#333333] mb-1">
                    2. Windows SmartScreen 경고 팝업 시
                  </strong>
                  파란색 "PC 보호" 경고 창에서 <strong>[추가 정보]</strong> 글자 클릭 후 하단 <strong>[실행]</strong> 버튼 클릭.
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="block font-bold text-[#333333] mb-1">
                    3. 수동 IP 지정 추가 방법
                  </strong>
                  프롬프트에서 <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">PartneronAgent.exe --add-ip 192.168.10.55</code> 실행.
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
