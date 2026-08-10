"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AppFooter } from "../../../components/layout/AppFooter";

export interface SalesOpportunityDto {
  id: number;
  // 1) 영업기회관리
  customer_name: string;
  opportunity_name: string;
  workspace_name: string;
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
  const [selectedOpportunity, setSelectedOpportunity] = useState<SalesOpportunityDto | null>(null);

  // Initial Registered Customer Names for Dropdown (Section 1)
  const registeredCustomers = [
    "(주) 글로벌 솔루션 강남점",
    "삼정 IT 물류 센터",
    "한일 제약 연구소",
    "ABC 상사 (본사)",
  ];

  // Initial Sample Sales Opportunities Data (Fujifilm BI Portal Style)
  const [opportunities, setOpportunities] = useState<SalesOpportunityDto[]>([
    {
      id: 1,
      customer_name: "(주) 글로벌 솔루션 강남점",
      opportunity_name: "강남 본사 복합기 3대 교체 렌탈 건",
      workspace_name: "FBKR 파트너스",
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
  ]);

  // Modal Form State (Fujifilm BI Portal Form Standard)
  const [formData, setFormData] = useState<Omit<SalesOpportunityDto, "id">>({
    customer_name: registeredCustomers[0],
    opportunity_name: "",
    workspace_name: "FBKR 파트너스",
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

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);

    const savedWorkplace = sessionStorage.getItem("workplaceName") || "FBKR 파트너스";
    setFormData((prev) => ({
      ...prev,
      workspace_name: savedWorkplace,
    }));
  }, []);

  const filteredOpportunities = opportunities.filter(
    (o) =>
      o.opportunity_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.device_model.toLowerCase().includes(search.toLowerCase())
  );

  function handleRowClick(o: SalesOpportunityDto) {
    setSelectedOpportunity(o);
    setIsDetailModalOpen(true);
  }

  function handleSaveOpportunity() {
    if (!formData.opportunity_name.trim()) {
      alert("영업명을 입력해 주세요.");
      return;
    }
    const newId = opportunities.length > 0 ? Math.max(...opportunities.map((o) => o.id)) + 1 : 1;
    const newEntry: SalesOpportunityDto = {
      id: newId,
      ...formData,
    };
    setOpportunities([newEntry, ...opportunities]);
    setIsCreateModalOpen(false);
    alert(`'${formData.opportunity_name}' 영업 기회가 성공적으로 등록되었습니다.`);

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

  function renderStageBadge(stage: SalesOpportunityDto["sales_stage"]) {
    switch (stage) {
      case "고객 Contact":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">고객 Contact</span>;
      case "고객 Issue 확인":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-[#01916D]/10 text-[#01916D] border border-[#01916D]/30">Issue 확인</span>;
      case "고객 추가 Meeting":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">추가 Meeting</span>;
      case "견적서 제출":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">견적서 제출</span>;
      case "Closed":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-emerald-100 text-[#01916D] border border-emerald-300">Closed (계약)</span>;
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Fujifilm BI Portal Style Top Page Header */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-[#01916D] rounded-md p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <span>FUJIFILM BI ON PORTAL</span>
            <span>&rsaquo;</span>
            <span>CRM SYSTEM</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">영업 기회 및 활동 결과 관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                영업 기회 레저 (Sales Opportunity Ledger)
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                후지필름 BI On 파트너 영업 파이프라인, 예상 매출, 타팀 지원 대응 코멘트를 관제합니다.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="영업명 / 고객명 / 모델명"
                className="px-3 py-2 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded focus:outline-none focus:bg-white focus:border-[#01916D] w-64"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                + 신규 영업기회 등록
              </button>
            </div>
          </div>
        </div>

        {/* Fujifilm BI Portal High-Density B2B Grid Table */}
        <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-normal text-slate-800 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-[11px] font-extrabold text-slate-700 uppercase">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">NO</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">영업명 / 거래처 (소속 사업장)</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">고객명</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">영업단계</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">장비모델명 / 영업타입 / 유형</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">계약형태 / 시작일</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">예상매출금액 / 월도</th>
                  <th className="py-2.5 px-3 text-center">상세조회</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOpportunities.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => handleRowClick(o)}
                    className="hover:bg-emerald-50/50 transition-all cursor-pointer"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono border-r border-slate-200">{o.id}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{o.opportunity_name}</div>
                      <div className="text-[11px] text-slate-500">{o.workspace_name}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#01916D] border-r border-slate-200">{o.customer_name}</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">{renderStageBadge(o.sales_stage)}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <div className="font-semibold text-slate-800">{o.device_model}</div>
                      <div className="text-[11px] text-slate-500">
                        {o.deal_type} | {o.deal_category}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                      <div className="font-bold text-slate-900">{o.contract_type}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{o.start_date}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200">
                      <div className="font-bold text-slate-900">₩{o.expected_sales.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500">
                        계약: {o.expected_contract_month} | 매출: {o.expected_sales_month}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(o)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-[11px] rounded border border-slate-300 shadow-2xs cursor-pointer"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Fujifilm BI On Portal Standard 2-Section Registration Modal Popup */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-3xl w-full shadow-2xl border border-slate-300 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Official Emerald Header Bar */}
            <div className="bg-[#01916D] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 block">
                  FUJIFILM BI ON - SALES PIPELINE
                </span>
                <h2 className="text-base font-bold">신규 영업기회 2대 섹션 파이프라인 등록</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white hover:text-emerald-200 font-bold text-sm px-2 py-1 cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Section 1: 영업기회 관리 */}
              <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] border-l-4 border-[#01916D] pl-2 flex items-center gap-2">
                  1) 영업기회 관리 스펙
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객명 (고객 마스터 DB 연동)</label>
                    <select
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-[#01916D]"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">거래처 (소속 사업장명)</label>
                    <input
                      type="text"
                      disabled
                      value={formData.workspace_name}
                      className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">영업단계</label>
                    <select
                      value={formData.sales_stage}
                      onChange={(e) => setFormData({ ...formData, sales_stage: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">영업 타입</label>
                    <select
                      value={formData.deal_type}
                      onChange={(e) => setFormData({ ...formData, deal_type: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">계약형태</label>
                    <select
                      value={formData.contract_type}
                      onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">예상계약월도 (YYYY-MM)</label>
                    <input
                      type="month"
                      value={formData.expected_contract_month}
                      onChange={(e) => setFormData({ ...formData, expected_contract_month: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">예상매출월도 (YYYY-MM)</label>
                    <input
                      type="month"
                      value={formData.expected_sales_month}
                      onChange={(e) => setFormData({ ...formData, expected_sales_month: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">기타 (변동 사유)</label>
                    <textarea
                      rows={2}
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="특이사항 및 일정 변경 사유"
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: 활동 결과 */}
              <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] border-l-4 border-[#01916D] pl-2 flex items-center gap-2">
                  2) 활동 결과
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">FBKR 혹은 타 팀지원여부</label>
                    <select
                      value={formData.team_support}
                      onChange={(e) => setFormData({ ...formData, team_support: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
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
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-300 flex justify-end gap-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs rounded cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveOpportunity}
                className="px-5 py-2 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded shadow-sm cursor-pointer"
              >
                영업기회 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fujifilm BI On Portal Standard Sales Detail Modal Popup */}
      {isDetailModalOpen && selectedOpportunity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-3xl w-full shadow-2xl border border-slate-300 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 block">
                  FUJIFILM BI ON - SALES OPPORTUNITY DETAIL
                </span>
                <h2 className="text-base font-bold">{selectedOpportunity.opportunity_name}</h2>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-300 hover:text-white font-bold text-sm px-2 py-1 cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-800">
              {/* Section 1 */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-[#01916D] text-xs border-l-4 border-[#01916D] pl-2">
                  1) 영업기회 관리 스펙
                </h3>
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
                  <div className="col-span-3"><span className="text-slate-500">기타 (변동 사유):</span> <p className="mt-1 bg-white p-2 border border-slate-200 rounded">{selectedOpportunity.note || "-"}</p></div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-[#01916D] text-xs border-l-4 border-[#01916D] pl-2">
                  2) 활동 결과
                </h3>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div><span className="text-slate-500">FBKR/타팀 지원여부:</span> <strong>{selectedOpportunity.team_support}</strong></div>
                  <div><span className="text-slate-500">지원방법:</span> <strong>{selectedOpportunity.support_method}</strong></div>
                  <div className="col-span-2"><span className="text-slate-500">지원팀 처리 코멘트:</span> <p className="mt-1 bg-white p-2 border border-slate-200 rounded">{selectedOpportunity.support_comment || "-"}</p></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-300 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded hover:bg-slate-200 cursor-pointer"
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
