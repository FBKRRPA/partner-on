"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";
import { getAgentCodeByCustomer } from "../../../../lib/auth-api";

export interface ContractItem {
  id: number;
  contract_no: string;
  customer_name: string;
  period_months: number;
  start_date: string;
  end_date: string;
  monthly_fee: number;
  device_count: number;
  agent_status: "COLLECTING" | "UNINSTALLED" | "PENDING";
  agent_code?: string;
  note?: string;
}

export default function ContractsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [search, setSearch] = useState("");

  // Agent Code Modal State
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [activeContract, setActiveContract] = useState<ContractItem | null>(null);
  const [agentCode, setAgentCode] = useState("");
  const [agentStatusText, setAgentStatusText] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit / Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [editFormData, setEditFormData] = useState<ContractItem | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<Omit<ContractItem, "id">>({
    contract_no: `CNT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-04`,
    customer_name: "",
    period_months: 36,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split("T")[0],
    monthly_fee: 300000,
    device_count: 2,
    agent_status: "PENDING",
    note: "정식 신규 렌탈 계약",
  });

  const [contracts, setContracts] = useState<ContractItem[]>([
    {
      id: 1,
      contract_no: "CNT-202608-01",
      customer_name: "삼정 IT 물류 센터",
      period_months: 24,
      start_date: "2026-08-01",
      end_date: "2028-07-31",
      monthly_fee: 250000,
      device_count: 2,
      agent_status: "COLLECTING",
      agent_code: "AST-99A1K2",
      note: "물류 센터 2층 복합기 2대 렌탈 건",
    },
    {
      id: 2,
      contract_no: "CNT-202608-02",
      customer_name: "ABC 상사 (본사)",
      period_months: 36,
      start_date: "2026-08-10",
      end_date: "2029-08-09",
      monthly_fee: 450000,
      device_count: 4,
      agent_status: "UNINSTALLED",
      note: "본사 신규 복합기 4대 제안 성공 건",
    },
    {
      id: 3,
      contract_no: "CNT-202608-03",
      customer_name: "(주) 글로벌 솔루션 강남점",
      period_months: 36,
      start_date: "2026-08-15",
      end_date: "2029-08-14",
      monthly_fee: 380000,
      device_count: 3,
      agent_status: "PENDING",
      note: "강남 지사 출력 솔루션 포함 3대",
    },
  ]);

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const cName = urlParams.get("customer_name");
      if (cName) {
        setSearch(cName);
      }
    }
  }, []);

  const filteredContracts = contracts.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contract_no.toLowerCase().includes(search.toLowerCase())
  );

  function handleOpenAgentModal(e: React.MouseEvent, contract: ContractItem) {
    e.stopPropagation();
    setActiveContract(contract);
    setAgentModalOpen(true);
    setLoadingCode(true);
    setCopied(false);
    getAgentCodeByCustomer(accessToken, contract.customer_name)
      .then((res) => {
        setAgentCode(res.auth_code);
        setAgentStatusText(res.status || "PENDING");
      })
      .catch((err) => {
        alert(err instanceof Error ? err.message : "Agent 인증 코드를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoadingCode(false);
      });
  }

  function handleCopyCode() {
    if (!agentCode) return;
    navigator.clipboard.writeText(agentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRowClick(contract: ContractItem) {
    setSelectedContract(contract);
    setEditFormData(JSON.parse(JSON.stringify(contract)));
    setIsEditMode(false);
    setIsDetailModalOpen(true);
  }

  function handleSaveNewContract() {
    if (!createFormData.customer_name.trim()) {
      alert("계약 고객사명을 입력해 주세요.");
      return;
    }
    const newId = contracts.length > 0 ? Math.max(...contracts.map((c) => c.id)) + 1 : 1;
    const newEntry: ContractItem = {
      id: newId,
      ...createFormData,
    };
    setContracts([newEntry, ...contracts]);
    setIsCreateModalOpen(false);
    alert(`'${createFormData.customer_name}' 계약이 성공적으로 신규 수립되었습니다.`);

    setCreateFormData({
      contract_no: `CNT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-0${newId + 1}`,
      customer_name: "",
      period_months: 36,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split("T")[0],
      monthly_fee: 300000,
      device_count: 2,
      agent_status: "PENDING",
      note: "정식 신규 렌탈 계약",
    });
  }

  function handleUpdateContract() {
    if (!editFormData || !editFormData.customer_name.trim()) {
      alert("계약 고객사명을 입력해 주세요.");
      return;
    }
    setContracts((prev) =>
      prev.map((c) => (c.id === editFormData.id ? editFormData : c))
    );
    setSelectedContract(editFormData);
    setIsEditMode(false);
    alert(`계약번호 '${editFormData.contract_no}' 정보가 성공적으로 수정 및 저장되었습니다.`);
  }

  function handleDeleteContract(id: number, contractNo: string, customerName: string) {
    if (confirm(`정말로 '${customerName}' (${contractNo}) 계약 건을 삭제하시겠습니까?`)) {
      setContracts((prev) => prev.filter((c) => c.id !== id));
      setIsDetailModalOpen(false);
      alert(`'${customerName}' 계약 건이 삭제되었습니다.`);
    }
  }

  function renderAgentStatusBadge(status: ContractItem["agent_status"]) {
    switch (status) {
      case "COLLECTING":
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-[#01916D]">온라인 수집중</span>;
      case "UNINSTALLED":
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">현장 미설치</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700">인증 대기중</span>;
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>기준정보 관리</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">계약 관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                정식 계약 수립 및 Agent 수집기 코드 관리
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                체결된 계약 건의 렌탈 조건 관리 및 현장 설치용 8자리 Agent 인증 코드를 1-Click으로 생성/조회합니다. (행 클릭 시 수정/삭제 가능)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="계약번호 또는 고객사명 검색"
                className="w-full sm:w-64 px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-[#01916D]"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                + 신규 계약 등록
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10 text-center">선택</th>
                  <th className="p-4">계약번호</th>
                  <th className="p-4">계약 고객사명</th>
                  <th className="p-4">렌탈 계약기간</th>
                  <th className="p-4 text-right">월 렌탈료</th>
                  <th className="p-4 text-center">설치대수</th>
                  <th className="p-4 text-center">Agent 수집기 상태</th>
                  <th className="p-4 text-center">Agent 인증 코드 발급/조회</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-4 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-[#01916D]" />
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900">{c.contract_no}</td>
                    <td className="p-4 font-bold text-slate-900">{c.customer_name}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{c.start_date} ~ {c.end_date}</div>
                      <div className="text-[11px] text-slate-500">({c.period_months}개월 렌탈)</div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      ₩{c.monthly_fee.toLocaleString()}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800">{c.device_count}대</td>
                    <td className="p-4 text-center">{renderAgentStatusBadge(c.agent_status)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => handleOpenAgentModal(e, c)}
                        className="px-3.5 py-1.5 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        {c.agent_code ? `Agent 코드: ${c.agent_code}` : "Agent 코드 발급"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Agent Code Modal */}
      {agentModalOpen && activeContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  계약 고객사 현장 수집기 인증
                </span>
                <h2 className="text-lg font-black text-slate-900">{activeContract.customer_name}</h2>
              </div>
              <button
                onClick={() => setAgentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {loadingCode ? (
              <div className="py-8 text-center text-sm font-semibold text-slate-500 flex flex-col items-center gap-2">
                <span className="animate-spin text-2xl">🔄</span>
                <span>8자리 Agent 인증 코드를 생성 및 불러오는 중입니다...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center space-y-2">
                  <span className="text-xs font-bold text-[#01916D]">현장 설치용 8자리 Agent 인증 코드</span>
                  <div className="text-3xl font-black text-[#01916D] font-mono tracking-wider py-1">
                    {agentCode}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    계약번호: <span className="font-mono font-bold text-slate-800">{activeContract.contract_no}</span> | 수집 상태: <span className="font-bold text-slate-800">{agentStatusText}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-slate-800">현장 수집기 설치 방법 안내:</p>
                  <p>1. 현장 Windows PC에서 에이전트 수집기를 설치합니다.</p>
                  <p>2. 위 8자리 코드 <strong className="text-[#01916D]">{agentCode}</strong>를 입력하여 실행하면 본 계약 고객사로 실시간 카운터 수집이 시작됩니다.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 py-3 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>{copied ? "복사 완료!" : "8자리 코드 복사하기"}</span>
                  </button>
                  <button
                    onClick={() => setAgentModalOpen(false)}
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
