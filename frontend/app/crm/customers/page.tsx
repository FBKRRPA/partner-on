"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AppFooter } from "../../../components/layout/AppFooter";
import { getAgentCodeByCustomer } from "../../../lib/auth-api";

interface CustomerItem {
  id: number;
  name: string;
  biz_no: string;
  ceo_name: string;
  contact_person: string;
  phone: string;
  contract_status: "CONTRACTED" | "UNCONTRACTED" | "PENDING";
  printer_count: number;
}

export default function CrmCustomersPage() {
  const [accessToken, setAccessToken] = useState("");
  const [search, setSearch] = useState("");
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<CustomerItem | null>(null);
  const [agentCode, setAgentCode] = useState("");
  const [agentStatus, setAgentStatus] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);
  }, []);

  const sampleCustomers: CustomerItem[] = [
    {
      id: 1,
      name: "ABC 상사 (본사)",
      biz_no: "124-81-00912",
      ceo_name: "홍길동",
      contact_person: "김철수 팀장",
      phone: "010-1234-5678",
      contract_status: "CONTRACTED",
      printer_count: 4,
    },
    {
      id: 2,
      name: "삼정 IT 물류 센터",
      biz_no: "211-86-99102",
      ceo_name: "이영희",
      contact_person: "박민수 대리",
      phone: "010-9876-5432",
      contract_status: "CONTRACTED",
      printer_count: 2,
    },
    {
      id: 3,
      name: "(주) 글로벌 솔루션 강남점",
      biz_no: "105-87-33120",
      ceo_name: "최성호",
      contact_person: "정수진 과장",
      phone: "010-5555-8888",
      contract_status: "CONTRACTED",
      printer_count: 5,
    },
    {
      id: 4,
      name: "한일 제약 연구소",
      biz_no: "302-81-12093",
      ceo_name: "강태공",
      contact_person: "임성진 차장",
      phone: "010-7777-2222",
      contract_status: "PENDING",
      printer_count: 0,
    },
  ];

  const filteredCustomers = sampleCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  async function handleOpenAgentModal(cust: CustomerItem) {
    setActiveCustomer(cust);
    setModalOpen(true);
    setLoadingCode(true);
    setCopied(false);
    try {
      const res = await getAgentCodeByCustomer(accessToken, cust.name);
      setAgentCode(res.auth_code);
      setAgentStatus(res.status || "PENDING");
    } catch (err) {
      alert(err instanceof Error ? err.message : "수집기 코드를 불러오지 못했습니다.");
    } finally {
      setLoadingCode(false);
    }
  }

  function handleCopyCode() {
    if (!agentCode) return;
    navigator.clipboard.writeText(agentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>CRM</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">고객관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                계약 고객사 및 Agent 수집기 연동 관제
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                정식 렌탈 계약 고객사의 정보와 현장 설치용 8자리 Agent 인증 코드를 1-Click으로 즉시 호출합니다.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 고객사명, 담당자, 연락처 검색"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-[#01916D]"
              />
            </div>
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-[#01916D] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    {cust.contract_status === "CONTRACTED" ? "✅ 계약 체결" : "⏳ 계약 진행중"}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    설치 장비 {cust.printer_count}대
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{cust.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">사업자번호: {cust.biz_no}</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">대표자:</span>
                    <span className="font-semibold text-slate-800">{cust.ceo_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">담당자:</span>
                    <span className="font-semibold text-slate-800">{cust.contact_person}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">연락처:</span>
                    <span className="font-semibold font-mono text-[#01916D]">{cust.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {cust.contract_status === "CONTRACTED" ? (
                  <button
                    onClick={() => handleOpenAgentModal(cust)}
                    className="w-full py-3 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🔑 8자리 Agent 수집기 코드 불러오기</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 bg-slate-100 text-slate-400 font-semibold text-xs rounded-2xl cursor-not-allowed text-center"
                  >
                    계약 체결 후 Agent 코드 발급 가능
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Agent Code Modal */}
      {modalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  고객사 전용 수집기 인증
                </span>
                <h2 className="text-lg font-black text-slate-900">{activeCustomer.name}</h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {loadingCode ? (
              <div className="py-8 text-center text-sm font-semibold text-slate-500 flex flex-col items-center gap-2">
                <span className="animate-spin text-2xl">🔄</span>
                <span>고객사 전용 8자리 Agent 코드를 조회 중입니다...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center space-y-2">
                  <span className="text-xs font-bold text-[#01916D]">현장 설치용 8자리 Agent 인증 코드</span>
                  <div className="text-3xl font-black text-[#01916D] font-mono tracking-wider py-1">
                    {agentCode}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    상태: <span className="font-bold text-slate-800">{agentStatus}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-slate-800">💡 현장 수집기 설치 가이드:</p>
                  <p>1. 현장 Windows PC에서 에이전트 설치 프로그램을 실행합니다.</p>
                  <p>2. 위 8자리 코드 <strong className="text-[#01916D]">{agentCode}</strong>를 입력하면 자동으로 본 고객사에 매칭됩니다.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 py-3 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>{copied ? "✅ 복사 완료!" : "📋 8자리 코드 복사하기"}</span>
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
