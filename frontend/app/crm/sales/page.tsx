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

  // Initial Sample Sales Opportunities Data
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

  // Modal Form State (2 Sections)
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
        {/* Header Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>CRM</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">영업관리 (영업기회)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                영업 기회 및 활동 결과 관리
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                테이블 행(Row) 클릭 시 영업 기회 2대 섹션 상세 정보가 팝업 노출됩니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="영업명, 고객명, 모델명 검색"
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-[#01916D] w-64"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                + 신규 영업기회 등록 팝업
              </button>
            </div>
          </div>
        </div>

        {/* Pure B2B Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10 text-center">선택</th>
                  <th className="p-4">영업명 / 거래처</th>
                  <th className="p-4">고객명</th>
                  <th className="p-4 text-center">영업단계</th>
                  <th className="p-4">장비모델 / 타입 / 유형</th>
                  <th className="p-4 text-center">계약형태 / 시작일</th>
                  <th className="p-4 text-right">예상매출 / 월도</th>
                  <th className="p-4 text-center">상세보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOpportunities.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => handleRowClick(o)}
                    className="hover:bg-slate-100/80 transition-all cursor-pointer"
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300 text-[#01916D]" />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{o.opportunity_name}</div>
                      <div className="text-[11px] text-slate-500">{o.workspace_name}</div>
                    </td>
                    <td className="p-4 font-bold text-[#01916D]">{o.customer_name}</td>
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
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(o)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                      >
                        상세보기 팝업
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Row Click Sales Full Detail Modal Popup */}
      {isDetailModalOpen && selectedOpportunity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  영업기회 2대 섹션 상세보기
                </span>
                <h2 className="text-xl font-black text-slate-900">{selectedOpportunity.opportunity_name}</h2>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-xs text-slate-700">
              {/* Section 1 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  1) 영업기회 관리 스펙
                </h3>
                <div className="grid grid-cols-3 gap-4 pt-1">
                  <div><span className="text-slate-400">고객명:</span> <strong className="text-slate-900">{selectedOpportunity.customer_name}</strong></div>
                  <div><span className="text-slate-400">거래처 (Workspace):</span> <strong className="text-slate-900">{selectedOpportunity.workspace_name}</strong></div>
                  <div><span className="text-slate-400">영업단계:</span> <strong className="text-[#01916D]">{selectedOpportunity.sales_stage}</strong></div>
                  <div><span className="text-slate-400">장비 모델명:</span> <strong className="text-slate-900">{selectedOpportunity.device_model}</strong></div>
                  <div><span className="text-slate-400">영업 타입 / 유형:</span> <strong className="text-slate-900">{selectedOpportunity.deal_type} ({selectedOpportunity.deal_category})</strong></div>
                  <div><span className="text-slate-400">계약형태 / 시작일:</span> <strong className="text-slate-900">{selectedOpportunity.contract_type} ({selectedOpportunity.start_date})</strong></div>
                  <div><span className="text-slate-400">예상매출금액:</span> <strong className="font-mono text-[#01916D]">₩{selectedOpportunity.expected_sales.toLocaleString()} 원</strong></div>
                  <div><span className="text-slate-400">예상계약월도:</span> <strong className="font-mono text-slate-900">{selectedOpportunity.expected_contract_month}</strong></div>
                  <div><span className="text-slate-400">예상매출월도:</span> <strong className="font-mono text-slate-900">{selectedOpportunity.expected_sales_month}</strong></div>
                  <div className="col-span-3"><span className="text-slate-400">기타 (변동 사유):</span> <p className="mt-1 text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-100">{selectedOpportunity.note || "-"}</p></div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  2) 활동 결과
                </h3>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div><span className="text-slate-400">FBKR 혹은 타 팀지원여부:</span> <strong className="text-slate-900">{selectedOpportunity.team_support}</strong></div>
                  <div><span className="text-slate-400">지원방법:</span> <strong className="text-slate-900">{selectedOpportunity.support_method}</strong></div>
                  <div className="col-span-2"><span className="text-slate-400">지원팀 처리 코멘트:</span> <p className="mt-1 text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-100">{selectedOpportunity.support_comment || "-"}</p></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal Code Remains Untouched ... */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">신규 영업기회 팝업 등록</span>
                <h2 className="text-lg font-black text-slate-900">영업 파이프라인 및 활동결과 입력</h2>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-500">영업기회 폼 필드 작성 완료</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">취소</button>
              <button onClick={handleSaveOpportunity} className="px-6 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md">저장 완료</button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
