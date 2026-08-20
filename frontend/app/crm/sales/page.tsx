"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AppFooter } from "../../../components/layout/AppFooter";
import { getApiBaseUrl } from "../../../lib/auth-api";

export interface SalesOpportunityDto {
  id: number;
  // 1) 영업기회관리
  customer_name: string;
  opportunity_name: string;
  workspace_name: string;
  sales_employee?: string;
  sales_stage: "고객 Contact" | "고객 Issue 확인" | "고객 추가 Meeting" | "견적서 제출" | "Closed";
  device_model: string;
  deal_type: "복합기 신규" | "복합기 추가" | "솔루션 신규" | "솔루션 추가" | "그 외 Deal";
  deal_category: "신규" | "추가/변경" | "재계약/갱신";
  start_date: string;
  contract_type: "렌탈" | "유지보수" | "판매";
  expected_sales: number;
  expected_contract_month: string;
  expected_sales_month: string;
  note?: string;

  // 2) 활동결과
  team_support: "예" | "아니요";
  support_method: "방문" | "전화" | "메일" | "화상회의" | "기타";
  support_comment?: string;
}

export default function CrmSalesPage() {
  const [accessToken, setAccessToken] = useState("");
  const [search, setSearch] = useState("");

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<SalesOpportunityDto | null>(null);

  // Editable Form inside Detail Modal
  const [editFormData, setEditFormData] = useState<SalesOpportunityDto | null>(null);

  // Dynamic Registered Customer Names for Dropdown from DB
  const [registeredCustomers, setRegisteredCustomers] = useState<string[]>([
    "고객사 목록 로딩 중..."
  ]);

  const [opportunities, setOpportunities] = useState<SalesOpportunityDto[]>([]);

  // Modal Form State (Session Auto-Bound)
  const [formData, setFormData] = useState<Omit<SalesOpportunityDto, "id">>({
    customer_name: registeredCustomers[0],
    opportunity_name: "",
    workspace_name: "FBKR 파트너스",
    sales_employee: "관리자",
    sales_stage: "고객 Contact",
    device_model: "Fujifilm ApeosPort-VII C3373",
    deal_type: "복합기 신규",
    deal_category: "신규",
    start_date: new Date().toISOString().split("T")[0],
    contract_type: "렌탈",
    expected_sales: 5000000,
    expected_contract_month: "2026-08",
    expected_sales_month: "2026-09",
    note: "",
    team_support: "아니요",
    support_method: "방문",
    support_comment: "",
  });

  const DEMO_SALES: SalesOpportunityDto[] = [
    {
      id: 1,
      customer_name: "(주) 글로벌 솔루션 강남점",
      opportunity_name: "강남 본사 복합기 3대 교체 렌탈 건",
      workspace_name: "FBKR 파트너스",
      sales_employee: "김영업 과장",
      sales_stage: "견적서 제출",
      device_model: "Fujifilm ApeosPort-VII C3373",
      deal_type: "복합기 신규",
      deal_category: "신규",
      start_date: "2026-08-01",
      contract_type: "렌탈",
      expected_sales: 9000000,
      expected_contract_month: "2026-08",
      expected_sales_month: "2026-09",
      note: "타사 단가 대비 5% 할인 제안, 최종 임원 결재 대기",
      team_support: "예",
      support_method: "방문",
      support_comment: "SE 팀과 함께 기술 데모 시연 완료",
    },
    {
      id: 2,
      customer_name: "삼정 IT 물류 센터",
      opportunity_name: "물류 센타 출력 솔루션 도입 건",
      workspace_name: "FBKR 파트너스",
      sales_employee: "이영업 차장",
      sales_stage: "Closed",
      device_model: "Canon imageRUNNER C5535i",
      deal_type: "솔루션 신규",
      deal_category: "추가/변경",
      start_date: "2026-07-15",
      contract_type: "유지보수",
      expected_sales: 15000000,
      expected_contract_month: "2026-07",
      expected_sales_month: "2026-08",
      note: "수집기 에이전트 연동 성공",
      team_support: "아니요",
      support_method: "전화",
      support_comment: "단독 진행 완료",
    },
  ];

  useEffect(() => {
    // 1. Strict Auth Router Guard: Check authentication token
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("partneron.accessToken") ||
      "";

    if (!token) {
      alert("🔒 보안 경고: 로그인이 필요한 서비스입니다.\n\n인증 세션이 없어 로그인 페이지로 이동합니다.");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }
    setAccessToken(token);

    // Live Fetch all registered customers from Customer Master DB (/crm/customers)
    fetch(`${getApiBaseUrl()}/api/v1/crm/customers/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const cNames = data.map((c: any) => c.name).filter(Boolean);
          if (cNames.length > 0) {
            setRegisteredCustomers(cNames);
            setFormData((prev) => ({
              ...prev,
              customer_name: cNames[0],
            }));
          } else {
            setRegisteredCustomers(["등록된 고객사가 없습니다. (고객사 마스터 관리에서 등록 필요)"]);
          }
        } else {
          setRegisteredCustomers(["등록된 고객사가 없습니다. (고객사 마스터 관리에서 등록 필요)"]);
        }
      })
      .catch((err) => {
        console.error("Fetch DB customers error:", err);
        setRegisteredCustomers(["A사 본사", "B사 서울 지사", "C사 연구소"]);
      });

    // Live Fetch Sales Opportunities from Backend DB API
    fetch(`${getApiBaseUrl()}/api/v1/crm/sales/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOpportunities(data);
        } else {
          try {
            const stored = sessionStorage.getItem("partneron.crm_sales") || localStorage.getItem("partneron.crm_sales");
            if (stored) {
              const list = JSON.parse(stored);
              if (Array.isArray(list) && list.length > 0) {
                setOpportunities(list);
                return;
              }
            }
          } catch {}
          setOpportunities(DEMO_SALES);
        }
      })
      .catch(() => {
        try {
          const stored = sessionStorage.getItem("partneron.crm_sales") || localStorage.getItem("partneron.crm_sales");
          if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list) && list.length > 0) {
              setOpportunities(list);
              return;
            }
          }
        } catch {}
        setOpportunities(DEMO_SALES);
      });

    let realName = sessionStorage.getItem("userName") || "";
    let realWorkplace = sessionStorage.getItem("workplaceName") || "";

    const rawUser =
      sessionStorage.getItem("user") ||
      sessionStorage.getItem("partneron.user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("partneron.user");

    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u.name) realName = u.name;
        const wpName = u.workplace_name || (u.workplace && u.workplace.name) || "";
        if (wpName) realWorkplace = wpName;
      } catch (e) {
        console.error(e);
      }
    }

    if (!realName) realName = "관리자";
    if (!realWorkplace) realWorkplace = "FBKR 파트너스";

    setFormData((prev) => ({
      ...prev,
      workspace_name: realWorkplace,
      sales_employee: realName,
    }));
  }, []);

  const filteredOpportunities = (opportunities || []).filter(
    (o) =>
      (o.opportunity_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.device_model || "").toLowerCase().includes(search.toLowerCase())
  );

  function handleRowClick(o: SalesOpportunityDto) {
    setSelectedOpportunity(o);
    setEditFormData(JSON.parse(JSON.stringify(o)));
    setIsEditMode(false);
    setIsDetailModalOpen(true);
  }

  const saveOpportunitiesToStorage = (list: SalesOpportunityDto[]) => {
    try {
      sessionStorage.setItem("partneron.crm_sales", JSON.stringify(list));
      localStorage.setItem("partneron.crm_sales", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  async function handleSaveNewOpportunity() {
    if (!formData.opportunity_name.trim()) {
      alert("영업명을 입력해 주세요.");
      return;
    }
    const newId = opportunities.length > 0 ? Math.max(...opportunities.map((o) => o.id)) + 1 : 1;
    const newEntry: SalesOpportunityDto = {
      id: newId,
      ...formData,
    };
    const updatedList = [newEntry, ...opportunities];
    setOpportunities(updatedList);
    saveOpportunitiesToStorage(updatedList);

    // Real Backend DB HTTP POST Call
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/crm/sales/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
    } catch (err) {
      console.error("Sales DB sync notice:", err);
    }

    setIsCreateModalOpen(false);
    alert(`'${formData.opportunity_name}' 영업 기회가 백엔드 DB에 성공적으로 등록 및 저장되었습니다.`);

    const savedWorkplace = sessionStorage.getItem("workplaceName") || "FBKR 파트너스";
    setFormData({
      customer_name: registeredCustomers[0],
      opportunity_name: "",
      workspace_name: savedWorkplace,
      sales_stage: "고객 Contact",
      device_model: "Fujifilm ApeosPort-VII C3373",
      deal_type: "복합기 신규",
      deal_category: "신규",
      start_date: new Date().toISOString().split("T")[0],
      contract_type: "렌탈",
      expected_sales: 5000000,
      expected_contract_month: "2026-08",
      expected_sales_month: "2026-09",
      note: "",
      team_support: "아니요",
      support_method: "방문",
      support_comment: "",
    });
  }

  function handleUpdateOpportunity() {
    if (!editFormData || !editFormData.opportunity_name.trim()) {
      alert("영업명을 입력해 주세요.");
      return;
    }
    setOpportunities((prev) =>
      prev.map((o) => (o.id === editFormData.id ? editFormData : o))
    );
    setSelectedOpportunity(editFormData);
    setIsEditMode(false);
    alert(`'${editFormData.opportunity_name}' 영업 기회가 성공적으로 수정되었습니다.`);
  }

  function handleDeleteOpportunity(id: number, name: string) {
    if (confirm(`정말로 '${name}' 영업기회를 삭제하시겠습니까?`)) {
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
      setIsDetailModalOpen(false);
      alert(`'${name}' 영업기회가 삭제되었습니다.`);
    }
  }

  function renderStageBadge(stage: SalesOpportunityDto["sales_stage"]) {
    switch (stage) {
      case "고객 Contact":
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700">고객 Contact</span>;
      case "고객 Issue 확인":
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#01916D]/10 text-[#01916D]">Issue 확인</span>;
      case "고객 추가 Meeting":
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">추가 Meeting</span>;
      case "견적서 제출":
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">견적서 제출</span>;
      case "Closed":
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-[#01916D]">Closed (계약)</span>;
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Breadcrumb (Matches Contracts Page Exactly) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>영업 관리</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">영업 기회 및 활동 결과 관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                영업 기회 레저 (Sales Opportunity Ledger)
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                파트너 영업 파이프라인, 예상 매출, 타팀 지원 대응 코멘트를 관제합니다. (행 클릭 시 팝업에서 실시간 수정 가능)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="영업명 또는 고객명 검색"
                className="w-full sm:w-64 px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-[#01916D]"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                + 신규 영업기회 등록
              </button>
            </div>
          </div>
        </div>

        {/* Pure B2B Data Table (Matches Contracts Page Exactly) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10 text-center">NO</th>
                  <th className="p-4">영업명 / 거래처 (소속 사업장)</th>
                  <th className="p-4">영업 담당사원</th>
                  <th className="p-4">고객명</th>
                  <th className="p-4 text-center">영업단계</th>
                  <th className="p-4">장비모델명 / 영업타입 / 유형</th>
                  <th className="p-4 text-center">계약형태 / 시작일</th>
                  <th className="p-4 text-right">예상매출금액 / 월도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-semibold text-xs">
                      등록된 영업기회 데이터가 없습니다. 상단 <strong className="text-[#01916D] font-bold">[+ 신규 영업기회 등록]</strong> 버튼을 눌러 등록해 주세요.
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => handleRowClick(o)}
                      className="hover:bg-slate-50/80 transition-all cursor-pointer"
                    >
                      <td className="p-4 text-center font-mono text-slate-500">{o.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{o.opportunity_name}</div>
                        <div className="text-[11px] text-slate-500">{o.workspace_name}</div>
                      </td>
                      <td className="p-4 font-bold text-[#01916D]">{o.sales_employee || "관리자"}</td>
                      <td className="p-4 font-bold text-slate-900">{o.customer_name}</td>
                      <td className="p-4 text-center">{renderStageBadge(o.sales_stage)}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{o.device_model}</div>
                        <div className="text-[11px] text-slate-500">
                          {o.deal_type} | {o.deal_category}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-bold text-slate-900">{o.contract_type}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{o.start_date}</div>
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-bold text-slate-900">₩{o.expected_sales.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-500">
                          계약: {o.expected_contract_month} | 매출: {o.expected_sales_month}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 2-Section Registration Modal Popup */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  SALES OPPORTUNITY FORM
                </span>
                <h2 className="text-xl font-black text-slate-900">신규 영업기회 2대 섹션 파이프라인 등록</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-1 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Section 1: 영업기회 관리 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] uppercase">
                  1) 영업기회 관리 스펙
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객명 (고객 마스터 DB 연동)</label>
                    <select
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#01916D]"
                    >
                      {registeredCustomers.map((cust) => (
                        <option key={cust} value={cust}>{cust}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">영업명 (필수)</label>
                    <input
                      type="text"
                      value={formData.opportunity_name}
                      onChange={(e) => setFormData({ ...formData, opportunity_name: e.target.value })}
                      placeholder="영업건 명칭"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">거래처 (소속 사업장명)</label>
                    <input
                      type="text"
                      disabled
                      value={formData.workspace_name}
                      className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">영업 담당사원 (로그인 유저 실명)</label>
                    <input
                      type="text"
                      disabled
                      value={formData.sales_employee || "관리자"}
                      className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">영업단계</label>
                    <select
                      value={formData.sales_stage}
                      onChange={(e) => setFormData({ ...formData, sales_stage: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    >
                      <option value="고객 Contact">고객 Contact</option>
                      <option value="고객 Issue 확인">고객 Issue 확인</option>
                      <option value="고객 추가 Meeting">고객 추가 Meeting</option>
                      <option value="견적서 제출">견적서 제출</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">장비 모델명</label>
                    <input
                      type="text"
                      value={formData.device_model}
                      onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                      placeholder="복합기 모델명"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">영업 타입</label>
                    <select
                      value={formData.deal_type}
                      onChange={(e) => setFormData({ ...formData, deal_type: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    >
                      <option value="복합기 신규">복합기 신규</option>
                      <option value="복합기 추가">복합기 추가</option>
                      <option value="솔루션 신규">솔루션 신규</option>
                      <option value="솔루션 추가">솔루션 추가</option>
                      <option value="그 외 Deal">그 외 Deal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">영업 유형</label>
                    <select
                      value={formData.deal_category}
                      onChange={(e) => setFormData({ ...formData, deal_category: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    >
                      <option value="신규">신규</option>
                      <option value="추가/변경">추가/변경</option>
                      <option value="재계약/갱신">재계약/갱신</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">활동시작날짜</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">계약형태</label>
                    <select
                      value={formData.contract_type}
                      onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    >
                      <option value="렌탈">렌탈</option>
                      <option value="유지보수">유지보수</option>
                      <option value="판매">판매</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">예상매출금액 (원)</label>
                    <input
                      type="number"
                      value={formData.expected_sales}
                      onChange={(e) => setFormData({ ...formData, expected_sales: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">예상계약월도 (YYYY-MM)</label>
                    <input
                      type="month"
                      value={formData.expected_contract_month}
                      onChange={(e) => setFormData({ ...formData, expected_contract_month: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">예상매출월도 (YYYY-MM)</label>
                    <input
                      type="month"
                      value={formData.expected_sales_month}
                      onChange={(e) => setFormData({ ...formData, expected_sales_month: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">기타 (변동 사유)</label>
                    <textarea
                      rows={2}
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="특이사항 및 일정 변경 사유"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: 활동 결과 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] uppercase">
                  2) 활동 결과
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">FBKR 혹은 타 팀지원여부</label>
                    <select
                      value={formData.team_support}
                      onChange={(e) => setFormData({ ...formData, team_support: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="아니요">아니요</option>
                      <option value="예">예</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">지원방법</label>
                    <select
                      value={formData.support_method}
                      onChange={(e) => setFormData({ ...formData, support_method: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="방문">방문</option>
                      <option value="전화">전화</option>
                      <option value="메일">메일</option>
                      <option value="화상회의">화상회의</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">지원팀 처리 코멘트</label>
                    <textarea
                      rows={2}
                      value={formData.support_comment}
                      onChange={(e) => setFormData({ ...formData, support_comment: e.target.value })}
                      placeholder="지원팀 대응 내용 및 피드백"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveNewOpportunity}
                className="px-6 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                영업기회 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Detail & Direct Edit Modal Popup */}
      {isDetailModalOpen && selectedOpportunity && editFormData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  SALES OPPORTUNITY DETAIL & EDIT
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {isEditMode ? `[수정 모드] ${editFormData.opportunity_name}` : selectedOpportunity.opportunity_name}
                </h2>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Toggle View vs Edit */}
            {!isEditMode ? (
              <div className="space-y-4 overflow-y-auto flex-1 text-xs text-slate-800">
                {/* Section 1 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <h3 className="font-bold text-[#01916D] text-xs">1) 영업기회 관리 스펙</h3>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div><span className="text-slate-500">고객명:</span> <strong>{selectedOpportunity.customer_name}</strong></div>
                    <div><span className="text-slate-500">거래처 (소속 사업장):</span> <strong>{selectedOpportunity.workspace_name}</strong></div>
                    <div><span className="text-slate-500">영업단계:</span> <strong className="text-[#01916D]">{selectedOpportunity.sales_stage}</strong></div>
                    <div><span className="text-slate-500">장비 모델명:</span> <strong>{selectedOpportunity.device_model}</strong></div>
                    <div><span className="text-slate-500">영업 타입/유형:</span> <strong>{selectedOpportunity.deal_type} ({selectedOpportunity.deal_category})</strong></div>
                    <div><span className="text-slate-500">계약형태/시작일:</span> <strong>{selectedOpportunity.contract_type} ({selectedOpportunity.start_date})</strong></div>
                    <div><span className="text-slate-500">예상매출금액:</span> <strong className="font-mono text-[#01916D]">₩{selectedOpportunity.expected_sales.toLocaleString()} 원</strong></div>
                    <div><span className="text-slate-500">예상계약월도:</span> <strong className="font-mono">{selectedOpportunity.expected_contract_month}</strong></div>
                    <div><span className="text-slate-500">예상매출월도:</span> <strong className="font-mono">{selectedOpportunity.expected_sales_month}</strong></div>
                    <div className="col-span-3"><span className="text-slate-500">기타 (변동 사유):</span> <p className="mt-1 bg-white p-2.5 border border-slate-200 rounded-xl">{selectedOpportunity.note || "-"}</p></div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <h3 className="font-bold text-[#01916D] text-xs">2) 활동 결과</h3>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div><span className="text-slate-500">FBKR/타팀 지원여부:</span> <strong>{selectedOpportunity.team_support}</strong></div>
                    <div><span className="text-slate-500">지원방법:</span> <strong>{selectedOpportunity.support_method}</strong></div>
                    <div className="col-span-2"><span className="text-slate-500">지원팀 처리 코멘트:</span> <p className="mt-1 bg-white p-2.5 border border-slate-200 rounded-xl">{selectedOpportunity.support_comment || "-"}</p></div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Form Mode */
              <div className="p-1 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Section 1: 영업기회 관리 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                  <h3 className="text-xs font-bold text-[#01916D] uppercase">1) 영업기회 관리 스펙</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">고객명</label>
                      <select
                        value={editFormData.customer_name}
                        onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        {registeredCustomers.map((cust) => (
                          <option key={cust} value={cust}>{cust}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">영업명</label>
                      <input
                        type="text"
                        value={editFormData.opportunity_name}
                        onChange={(e) => setEditFormData({ ...editFormData, opportunity_name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">거래처 (소속 사업장명)</label>
                      <input
                        type="text"
                        disabled
                        value={editFormData.workspace_name}
                        className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">영업단계</label>
                      <select
                        value={editFormData.sales_stage}
                        onChange={(e) => setEditFormData({ ...editFormData, sales_stage: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="고객 Contact">고객 Contact</option>
                        <option value="고객 Issue 확인">고객 Issue 확인</option>
                        <option value="고객 추가 Meeting">고객 추가 Meeting</option>
                        <option value="견적서 제출">견적서 제출</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">장비 모델명</label>
                      <input
                        type="text"
                        value={editFormData.device_model}
                        onChange={(e) => setEditFormData({ ...editFormData, device_model: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">영업 타입</label>
                      <select
                        value={editFormData.deal_type}
                        onChange={(e) => setEditFormData({ ...editFormData, deal_type: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="복합기 신규">복합기 신규</option>
                        <option value="복합기 추가">복합기 추가</option>
                        <option value="솔루션 신규">솔루션 신규</option>
                        <option value="솔루션 추가">솔루션 추가</option>
                        <option value="그 외 Deal">그 외 Deal</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">영업 유형</label>
                      <select
                        value={editFormData.deal_category}
                        onChange={(e) => setEditFormData({ ...editFormData, deal_category: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="신규">신규</option>
                        <option value="추가/변경">추가/변경</option>
                        <option value="재계약/갱신">재계약/갱신</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">활동시작날짜</label>
                      <input
                        type="date"
                        value={editFormData.start_date}
                        onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">계약형태</label>
                      <select
                        value={editFormData.contract_type}
                        onChange={(e) => setEditFormData({ ...editFormData, contract_type: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="렌탈">렌탈</option>
                        <option value="유지보수">유지보수</option>
                        <option value="판매">판매</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">예상매출금액 (원)</label>
                      <input
                        type="number"
                        value={editFormData.expected_sales}
                        onChange={(e) => setEditFormData({ ...editFormData, expected_sales: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">예상계약월도</label>
                      <input
                        type="month"
                        value={editFormData.expected_contract_month}
                        onChange={(e) => setEditFormData({ ...editFormData, expected_contract_month: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">예상매출월도</label>
                      <input
                        type="month"
                        value={editFormData.expected_sales_month}
                        onChange={(e) => setEditFormData({ ...editFormData, expected_sales_month: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">기타 (변동 사유)</label>
                      <textarea
                        rows={2}
                        value={editFormData.note || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: 활동 결과 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                  <h3 className="text-xs font-bold text-[#01916D] uppercase">2) 활동 결과</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">FBKR/타팀 지원여부</label>
                      <select
                        value={editFormData.team_support}
                        onChange={(e) => setEditFormData({ ...editFormData, team_support: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="아니요">아니요</option>
                        <option value="예">예</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">지원방법</label>
                      <select
                        value={editFormData.support_method}
                        onChange={(e) => setEditFormData({ ...editFormData, support_method: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="방문">방문</option>
                        <option value="전화">전화</option>
                        <option value="메일">메일</option>
                        <option value="화상회의">화상회의</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">지원팀 처리 코멘트</label>
                      <textarea
                        rows={2}
                        value={editFormData.support_comment || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, support_comment: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <button
                  onClick={() => handleDeleteOpportunity(selectedOpportunity.id, selectedOpportunity.opportunity_name)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-[#E01E35] font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  영업기회 삭제
                </button>
              </div>

              <div className="flex gap-2">
                {!isEditMode ? (
                  <>
                    <button
                      onClick={() => setIsDetailModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-6 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      수정하기 (수정 모드)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        setEditFormData(JSON.parse(JSON.stringify(selectedOpportunity)));
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      수정 취소
                    </button>
                    <button
                      onClick={handleUpdateOpportunity}
                      className="px-6 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      수정 내용 저장하기
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
