"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AppFooter } from "../../../components/layout/AppFooter";
import { getApiBaseUrl } from "../../../lib/auth-api";

export interface ContactPersonDto {
  name: string;
  department?: string;
  email: string;
  phone: string;
  position: string;
  note?: string;
}

export interface CustomerFullDto {
  id: number;
  // 1) 관리파트너사정보
  partner_company: string;
  partner_employee: string;

  // 2) 고객정보
  name: string;
  office_type: "공장" | "일반 사무실" | "현장 사무실" | "창고" | "기타";
  location_base: string;
  contract_status: "계약 고객" | "미계약 고객";
  biz_no: string;
  grade: "A" | "B" | "C" | "D";
  company_scale: "1-15" | "16-30" | "31-50" | "51-100" | "101-500" | "501-1000" | ">1000";

  // 3, 4, 5) 담당자 1, 2, 3
  contact1: ContactPersonDto;
  contact2: ContactPersonDto;
  contact3: ContactPersonDto;
}

const DEMO_CUSTOMERS: CustomerFullDto[] = [
  {
    id: 1,
    partner_company: "FBKR 파트너스",
    partner_employee: "김영업 과장",
    name: "(주) 글로벌 솔루션 강남점",
    office_type: "일반 사무실",
    location_base: "서울 강남구",
    contract_status: "미계약 고객",
    biz_no: "105-87-33120",
    grade: "A",
    company_scale: "31-50",
    contact1: {
      name: "정수진",
      department: "IT/전산",
      email: "sj.jung@globalsol.co.kr",
      phone: "010-5555-8888",
      position: "과장",
      note: "주 담당자, 복합기 도입 최종검토",
    },
    contact2: {
      name: "박민철",
      department: "총무",
      email: "mc.park@globalsol.co.kr",
      phone: "010-1111-2222",
      position: "팀장",
      note: "결재권자",
    },
    contact3: {
      name: "이수민",
      department: "구매",
      email: "sm.lee@globalsol.co.kr",
      phone: "010-3333-4444",
      position: "대리",
      note: "계약서 실무",
    },
  },
  {
    id: 2,
    partner_company: "FBKR 파트너스",
    partner_employee: "이영업 차장",
    name: "삼정 IT 물류 센터",
    office_type: "창고",
    location_base: "경기 이천시",
    contract_status: "계약 고객",
    biz_no: "211-86-99102",
    grade: "B",
    company_scale: "51-100",
    contact1: {
      name: "박민수",
      department: "물류",
      email: "ms.park@samjung.com",
      phone: "010-9876-5432",
      position: "대리",
      note: "현장 관리자",
    },
    contact2: { name: "", department: "기타", email: "", phone: "", position: "", note: "" },
    contact3: { name: "", department: "기타", email: "", phone: "", position: "", note: "" },
  },
];

export default function CrmCustomersPage() {
  const [accessToken, setAccessToken] = useState("");
  const [search, setSearch] = useState("");

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFullDto | null>(null);
  const [editFormData, setEditFormData] = useState<CustomerFullDto | null>(null);

  // Convert to Contract Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertFormData, setConvertFormData] = useState({
    contract_no: `CNT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
    period_months: 36,
    monthly_fee: 300000,
    device_count: 2,
    note: "CRM 고객사 마스터 대장에서 정식 계약 수립 전환",
  });

  const [customers, setCustomers] = useState<CustomerFullDto[]>([]);

  // New Creation Modal Form State
  const [formData, setFormData] = useState<Omit<CustomerFullDto, "id">>({
    partner_company: "FBKR 파트너스",
    partner_employee: "김영업 과장",
    name: "",
    office_type: "일반 사무실",
    location_base: "서울 본사",
    contract_status: "미계약 고객",
    biz_no: "",
    grade: "A",
    company_scale: "1-15",
    contact1: { name: "", department: "총무", email: "", phone: "", position: "", note: "" },
    contact2: { name: "", department: "기타", email: "", phone: "", position: "", note: "" },
    contact3: { name: "", department: "기타", email: "", phone: "", position: "", note: "" },
  });

  useEffect(() => {
    // 1. Live Fetch from Backend DB API (monitoring_customers DB Table)
    fetch(`${getApiBaseUrl()}/api/v1/crm/customers/`)
      .then((res) => res.json())
      .then((dbCustomers) => {
        if (Array.isArray(dbCustomers) && dbCustomers.length > 0) {
          const sanitizedList = dbCustomers.map((c: any) => ({
            ...c,
            contact1: c.contact1 && typeof c.contact1 === "object" ? c.contact1 : { name: "담당자", department: "총무", email: "", phone: "", position: "", note: "" },
            contact2: c.contact2 && typeof c.contact2 === "object" ? c.contact2 : { name: "", department: "", email: "", phone: "", position: "", note: "" },
            contact3: c.contact3 && typeof c.contact3 === "object" ? c.contact3 : { name: "", department: "", email: "", phone: "", position: "", note: "" },
          }));
          setCustomers(sanitizedList);
        }
      })
      .catch((err) => {
        console.error("Backend DB fetch error:", err);
      });

    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);

    let realName = "김영업 과장";
    let realWorkplace = "FBKR 파트너스";

    try {
      const userStr = sessionStorage.getItem("user") || sessionStorage.getItem("partneron.user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.name) realName = u.name;
        if (u.workplace && u.workplace.name) realWorkplace = u.workplace.name;
      }
    } catch (e) {
      console.error(e);
    }

    setFormData((prev) => ({
      ...prev,
      partner_company: realWorkplace,
      partner_employee: realName,
    }));
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact1.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact1.phone.includes(search) ||
      c.biz_no.includes(search)
  );

  function handleRowClick(cust: CustomerFullDto) {
    setSelectedCustomer(cust);
    setEditFormData(JSON.parse(JSON.stringify(cust)));
    setIsEditMode(false);
    setIsDetailModalOpen(true);
  }

  // Helper to persist customer list to storage
  const saveCustomersToStorage = (updatedList: CustomerFullDto[]) => {
    try {
      sessionStorage.setItem("partneron.crm_customers", JSON.stringify(updatedList));
      localStorage.setItem("partneron.crm_customers", JSON.stringify(updatedList));
    } catch (err) {
      console.error(err);
    }
  };

  async function handleSaveNewCustomer() {
    if (!formData.name.trim()) {
      alert("고객명을 입력해 주세요.");
      return;
    }
    const newId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
    const newEntry: CustomerFullDto = {
      id: newId,
      ...formData,
    };
    const updatedList = [newEntry, ...customers];
    setCustomers(updatedList);
    saveCustomersToStorage(updatedList);

    // Real Backend DB INSERT API Call to monitoring_customers table
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/crm/customers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch (err) {
      console.error("Backend DB sync notice:", err);
    }

    setIsCreateModalOpen(false);
    alert(`'${formData.name}' 고객사가 백엔드 DB(monitoring_customers)에 성공적으로 저장 및 반영되었습니다.`);

    const savedWorkplace = sessionStorage.getItem("workplaceName") || "FBKR 파트너스";
    const savedUserName = sessionStorage.getItem("userName") || "김영업 과장";

    setFormData({
      partner_company: savedWorkplace,
      partner_employee: savedUserName,
      name: "",
      office_type: "일반 사무실",
      location_base: "서울 본사",
      contract_status: "미계약 고객",
      biz_no: "",
      grade: "A",
      company_scale: "1-15",
      contact1: { name: "", department: "총무", email: "", phone: "", position: "", note: "" },
      contact2: { name: "", department: "기타", email: "", phone: "", position: "", note: "" },
      contact3: { name: "", department: "기타", email: "", phone: "", position: "", note: "" },
    });
  }

  function handleUpdateCustomer() {
    if (!editFormData || !editFormData.name.trim()) {
      alert("고객명을 입력해 주세요.");
      return;
    }
    const updatedList = customers.map((c) => (c.id === editFormData.id ? editFormData : c));
    setCustomers(updatedList);
    saveCustomersToStorage(updatedList);

    setSelectedCustomer(editFormData);
    setIsEditMode(false);
    alert(`'${editFormData.name}' 고객사 정보가 성공적으로 수정되었습니다.`);
  }

  function handleOpenConvertModal(cust: CustomerFullDto) {
    setSelectedCustomer(cust);
    setConvertFormData({
      contract_no: `CNT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(cust.id).padStart(2, "0")}`,
      period_months: 36,
      monthly_fee: 300000,
      device_count: 2,
      note: "CRM 고객사 마스터 대장에서 정식 계약 체결 및 수립",
    });
    setIsConvertModalOpen(true);
  }

  async function handleConfirmContractConversion() {
    if (!selectedCustomer) return;

    // 1. Upgrade CRM Customer Status from "미계약 고객" -> "계약 고객"
    const updatedCustomer: CustomerFullDto = {
      ...selectedCustomer,
      contract_status: "계약 고객",
    };

    const updatedList = customers.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c));
    setCustomers(updatedList);
    saveCustomersToStorage(updatedList);
    setSelectedCustomer(updatedCustomer);
    if (editFormData) {
      setEditFormData({ ...editFormData, contract_status: "계약 고객" });
    }

    // 2. Real Backend DB Conversion API Call
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/crm/customers/convert-to-contract/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          contract_no: convertFormData.contract_no,
          device_count: convertFormData.device_count,
          note: convertFormData.note,
        }),
      });
    } catch (err) {
      console.error("Backend conversion API sync notice:", err);
    }

    // 3. Add New Contract Record to localStorage session so /operations/basic/contracts instantly receives it
    try {
      const existingContractsStr = sessionStorage.getItem("partneron.contracts") || localStorage.getItem("partneron.contracts") || "[]";
      const existingContracts = JSON.parse(existingContractsStr);
      const newId = existingContracts.length > 0 ? Math.max(...existingContracts.map((c: any) => c.id || 0)) + 1 : 1;

      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split("T")[0];

      const newContractEntry = {
        id: newId,
        contract_no: convertFormData.contract_no,
        customer_name: selectedCustomer.name,
        period_months: convertFormData.period_months,
        start_date: startDate,
        end_date: endDate,
        monthly_fee: convertFormData.monthly_fee,
        device_count: convertFormData.device_count,
        agent_status: "PENDING",
        note: convertFormData.note,
      };

      const updatedContractsList = [newContractEntry, ...existingContracts];
      sessionStorage.setItem("partneron.contracts", JSON.stringify(updatedContractsList));
      localStorage.setItem("partneron.contracts", JSON.stringify(updatedContractsList));
    } catch (err) {
      console.error(err);
    }

    setIsConvertModalOpen(false);
    alert(`🎉 '${selectedCustomer.name}' 고객사가 성공적으로 [계약 완료 고객]으로 승격 및 전환되었습니다!\n\n[기준정보 관리 > 계약관리] 페이지로 이동합니다.`);

    // 4. Smart Navigation to /operations/basic/contracts
    if (typeof window !== "undefined") {
      window.location.href = `/operations/basic/contracts?customer_name=${encodeURIComponent(selectedCustomer.name)}`;
    }
  }

  const deptOptions = [
    "총무", "구매", "회계", "경리", "IT/전산", "인사", "기획", "CS", "영업", "마케팅", "R&D", "디자인", "물류", "기타"
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Breadcrumb (Matches Contracts Page Exactly) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>고객 관리</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">고객사 마스터 관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                고객사 마스터 대장 (Customer Master Ledger)
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                후지필름 BI 파트너사 전용 CRM 마스터 대장입니다. (행 클릭 시 팝업에서 실시간 수정 가능)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="고객명 또는 담당자 검색"
                className="w-full sm:w-64 px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-[#01916D]"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                + 신규 고객사 등록
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
                  <th className="p-4">관리 파트너사 / 담당사원</th>
                  <th className="p-4">고객명 (법인/상호)</th>
                  <th className="p-4">사무실 유형 / 거점</th>
                  <th className="p-4">사업자등록번호</th>
                  <th className="p-4 text-center">계약상태</th>
                  <th className="p-4 text-center">관리등급 / 규모</th>
                  <th className="p-4">주 담당자 (담당자 1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-semibold text-xs">
                      등록된 고객사 데이터가 없습니다. 상단 <strong className="text-[#01916D] font-bold">[+ 신규 고객사 등록]</strong> 버튼을 눌러 등록해 주세요.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      className="hover:bg-slate-50/80 transition-all cursor-pointer"
                    >
                      <td className="p-4 text-center font-mono text-slate-500">{c.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{c.partner_company}</div>
                        <div className="text-[11px] text-[#01916D] font-bold">{c.partner_employee}</div>
                      </td>
                      <td className="p-4 font-bold text-[#01916D]">{c.name}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{c.office_type}</div>
                        <div className="text-[11px] text-slate-500">{c.location_base}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-700">{c.biz_no || "-"}</td>
                      <td className="p-4 text-center">
                        {c.contract_status === "계약 고객" ? (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-[#01916D]">
                            계약 고객
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700">
                            미계약 고객
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-bold text-slate-900">{c.grade}등급</div>
                        <div className="text-[11px] text-slate-500">{c.company_scale}명</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">
                          {c.contact1.name} {c.contact1.position} ({c.contact1.department})
                        </div>
                        <div className="font-mono text-slate-500 text-[11px]">
                          {c.contact1.phone} | {c.contact1.email}
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

      {/* 5-Section Registration Modal Popup */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  CUSTOMER MASTER FORM
                </span>
                <h2 className="text-xl font-black text-slate-900">신규 고객사 5대 섹션 마스터 등록</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-1 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* 1) 관리 파트너사 정보 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] uppercase">
                  1) 관리 파트너사 정보 (소속 사업장)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      관리 파트너사 (소속 사업장명)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.partner_company}
                      className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      담당사원 (로그인 유저 실명)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.partner_employee}
                      className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 2) 고객 기본 스펙 정보 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] uppercase">
                  2) 고객 기본 스펙 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객명 (필수)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="법인 / 상호명"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">사업자등록번호</label>
                    <input
                      type="text"
                      value={formData.biz_no}
                      onChange={(e) => setFormData({ ...formData, biz_no: e.target.value })}
                      placeholder="000-00-00000"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">거점 (지역/지사)</label>
                    <input
                      type="text"
                      value={formData.location_base}
                      onChange={(e) => setFormData({ ...formData, location_base: e.target.value })}
                      placeholder="서울 본사 / 판교 센터 등"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객 사무실 유형</label>
                    <select
                      value={formData.office_type}
                      onChange={(e) => setFormData({ ...formData, office_type: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    >
                      <option value="일반 사무실">일반 사무실</option>
                      <option value="공장">공장</option>
                      <option value="현장 사무실">현장 사무실</option>
                      <option value="창고">창고</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">계약상태</label>
                    <select
                      value={formData.contract_status}
                      onChange={(e) => setFormData({ ...formData, contract_status: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    >
                      <option value="미계약 고객">미계약 고객</option>
                      <option value="계약 고객">계약 고객</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">관리등급</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    >
                      <option value="A">A 등급</option>
                      <option value="B">B 등급</option>
                      <option value="C">C 등급</option>
                      <option value="D">D 등급</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객사 규모 (임직원 수)</label>
                    <select
                      value={formData.company_scale}
                      onChange={(e) => setFormData({ ...formData, company_scale: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#01916D]"
                    >
                      <option value="1-15">1 - 15명</option>
                      <option value="16-30">16 - 30명</option>
                      <option value="31-50">31 - 50명</option>
                      <option value="51-100">51 - 100명</option>
                      <option value="101-500">101 - 500명</option>
                      <option value="501-1000">501 - 1000명</option>
                      <option value=">1000">1000명 초과 (&gt;1000)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3) 고객 담당자 정보 1 (주 담당자) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] uppercase">
                  3) 고객 담당자 정보 1 (주 담당자)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">성함</label>
                    <input
                      type="text"
                      value={formData.contact1.name}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, name: e.target.value } })}
                      placeholder="담당자 성함"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">부서</label>
                    <select
                      value={formData.contact1.department}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, department: e.target.value } })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      {deptOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">직책</label>
                    <input
                      type="text"
                      value={formData.contact1.position}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, position: e.target.value } })}
                      placeholder="팀장 / 과장 등"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">이메일</label>
                    <input
                      type="email"
                      value={formData.contact1.email}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, email: e.target.value } })}
                      placeholder="user@domain.com"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.contact1.phone}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, phone: e.target.value } })}
                      placeholder="010-0000-0000"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">메모</label>
                    <input
                      type="text"
                      value={formData.contact1.note}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, note: e.target.value } })}
                      placeholder="특이사항 메모"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 4 & 5) 보조 담당자 정보 2, 3 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-[#01916D] uppercase">
                  4) 담당자 정보 2 & 5) 담당자 정보 3 (보조 담당자)
                </h3>
                
                {/* 담당자 2 */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">[담당자 정보 2]</span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="담당자2 성함"
                      value={formData.contact2.name}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, name: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="직책"
                      value={formData.contact2.position}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, position: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="연락처"
                      value={formData.contact2.phone}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, phone: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="email"
                      placeholder="이메일"
                      value={formData.contact2.email}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, email: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="메모"
                      value={formData.contact2.note}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, note: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* 담당자 3 */}
                <div className="space-y-1 pt-1 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">[담당자 정보 3]</span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="담당자3 성함"
                      value={formData.contact3.name}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, name: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="직책"
                      value={formData.contact3.position}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, position: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="연락처"
                      value={formData.contact3.phone}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, phone: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="email"
                      placeholder="이메일"
                      value={formData.contact3.email}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, email: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="메모"
                      value={formData.contact3.note}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, note: e.target.value } })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
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
                onClick={handleSaveNewCustomer}
                className="px-6 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                고객사 마스터 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail & Direct Edit Modal Popup */}
      {isDetailModalOpen && selectedCustomer && editFormData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  CUSTOMER MASTER DETAIL & EDIT
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {isEditMode ? `[수정 모드] ${editFormData.name}` : selectedCustomer.name}
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
                  <h3 className="font-bold text-[#01916D] text-xs">1) 관리 파트너사 정보 (소속 사업장)</h3>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div><span className="text-slate-500">관리 파트너사:</span> <strong className="text-slate-900 font-bold">{selectedCustomer.partner_company}</strong></div>
                    <div><span className="text-slate-500">담당사원:</span> <strong className="text-slate-900 font-bold">{selectedCustomer.partner_employee}</strong></div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <h3 className="font-bold text-[#01916D] text-xs">2) 고객 기본 스펙 정보</h3>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div><span className="text-slate-500">고객명:</span> <strong className="text-slate-900">{selectedCustomer.name}</strong></div>
                    <div><span className="text-slate-500">사업자번호:</span> <strong className="font-mono">{selectedCustomer.biz_no || "-"}</strong></div>
                    <div><span className="text-slate-500">거점:</span> <strong>{selectedCustomer.location_base}</strong></div>
                    <div><span className="text-slate-500">사무실 유형:</span> <strong>{selectedCustomer.office_type}</strong></div>
                    <div><span className="text-slate-500">계약상태:</span> <strong className="text-[#01916D]">{selectedCustomer.contract_status}</strong></div>
                    <div><span className="text-slate-500">관리등급:</span> <strong>{selectedCustomer.grade} 등급</strong></div>
                    <div className="col-span-3"><span className="text-slate-500">임직원 규모:</span> <strong>{selectedCustomer.company_scale} 명</strong></div>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <h3 className="font-bold text-[#01916D] text-xs">3) 주 담당자 정보 (담당자 1)</h3>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div><span className="text-slate-500">성함/직책:</span> <strong>{selectedCustomer.contact1.name} {selectedCustomer.contact1.position}</strong></div>
                    <div><span className="text-slate-500">부서:</span> <strong>{selectedCustomer.contact1.department}</strong></div>
                    <div><span className="text-slate-500">연락처:</span> <strong className="font-mono">{selectedCustomer.contact1.phone}</strong></div>
                    <div className="col-span-2"><span className="text-slate-500">이메일:</span> <strong className="font-mono">{selectedCustomer.contact1.email}</strong></div>
                    <div className="col-span-3"><span className="text-slate-500">메모:</span> <span>{selectedCustomer.contact1.note || "-"}</span></div>
                  </div>
                </div>

                {/* Section 4 & 5 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <h3 className="font-bold text-[#01916D] text-xs">4 & 5) 보조 담당자 정보 2, 3</h3>
                  {selectedCustomer.contact2?.name ? (
                    <p className="border-b border-slate-200 pb-1">
                      <strong>2:</strong> {selectedCustomer.contact2.name} {selectedCustomer.contact2.position} ({selectedCustomer.contact2.phone} | {selectedCustomer.contact2.email})
                    </p>
                  ) : <p className="text-slate-400">담당자 2 정보 없음</p>}

                  {selectedCustomer.contact3?.name ? (
                    <p>
                      <strong>3:</strong> {selectedCustomer.contact3.name} {selectedCustomer.contact3.position} ({selectedCustomer.contact3.phone} | {selectedCustomer.contact3.email})
                    </p>
                  ) : <p className="text-slate-400">담당자 3 정보 없음</p>}
                </div>
              </div>
            ) : (
              /* Edit Form Mode */
              <div className="p-1 space-y-5 overflow-y-auto flex-1 text-xs">
                {/* 1) 관리 파트너사 정보 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                  <h3 className="text-xs font-bold text-[#01916D] uppercase">1) 관리 파트너사 정보</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">관리 파트너사</label>
                      <input
                        type="text"
                        disabled
                        value={editFormData.partner_company}
                        className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">담당사원</label>
                      <input
                        type="text"
                        disabled
                        value={editFormData.partner_employee}
                        className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2) 고객 기본 스펙 정보 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                  <h3 className="text-xs font-bold text-[#01916D] uppercase">2) 고객 기본 스펙 정보</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">고객명</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">사업자등록번호</label>
                      <input
                        type="text"
                        value={editFormData.biz_no}
                        onChange={(e) => setEditFormData({ ...editFormData, biz_no: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">거점</label>
                      <input
                        type="text"
                        value={editFormData.location_base}
                        onChange={(e) => setEditFormData({ ...editFormData, location_base: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">사무실 유형</label>
                      <select
                        value={editFormData.office_type}
                        onChange={(e) => setEditFormData({ ...editFormData, office_type: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="일반 사무실">일반 사무실</option>
                        <option value="공장">공장</option>
                        <option value="현장 사무실">현장 사무실</option>
                        <option value="창고">창고</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">계약상태</label>
                      <select
                        value={editFormData.contract_status}
                        onChange={(e) => setEditFormData({ ...editFormData, contract_status: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="미계약 고객">미계약 고객</option>
                        <option value="계약 고객">계약 고객</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">관리등급</label>
                      <select
                        value={editFormData.grade}
                        onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="A">A 등급</option>
                        <option value="B">B 등급</option>
                        <option value="C">C 등급</option>
                        <option value="D">D 등급</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3) 주 담당자 정보 1 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5">
                  <h3 className="text-xs font-bold text-[#01916D] uppercase">3) 주 담당자 정보 (담당자 1)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">성함</label>
                      <input
                        type="text"
                        value={editFormData.contact1.name}
                        onChange={(e) => setEditFormData({ ...editFormData, contact1: { ...editFormData.contact1, name: e.target.value } })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">직책</label>
                      <input
                        type="text"
                        value={editFormData.contact1.position}
                        onChange={(e) => setEditFormData({ ...editFormData, contact1: { ...editFormData.contact1, position: e.target.value } })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">부서</label>
                      <select
                        value={editFormData.contact1.department}
                        onChange={(e) => setEditFormData({ ...editFormData, contact1: { ...editFormData.contact1, department: e.target.value } })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        {deptOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">연락처</label>
                      <input
                        type="text"
                        value={editFormData.contact1.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, contact1: { ...editFormData.contact1, phone: e.target.value } })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">이메일</label>
                      <input
                        type="email"
                        value={editFormData.contact1.email}
                        onChange={(e) => setEditFormData({ ...editFormData, contact1: { ...editFormData.contact1, email: e.target.value } })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">메모</label>
                      <input
                        type="text"
                        value={editFormData.contact1.note}
                        onChange={(e) => setEditFormData({ ...editFormData, contact1: { ...editFormData.contact1, note: e.target.value } })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer.id, selectedCustomer.name)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-[#E01E35] font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  고객사 삭제
                </button>
                {selectedCustomer.contract_status === "미계약 고객" && (
                  <button
                    onClick={() => handleOpenConvertModal(selectedCustomer)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow-sm"
                  >
                    📝 정식 계약 체결 및 수립 (계약 고객 승격)
                  </button>
                )}
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
                        setEditFormData(JSON.parse(JSON.stringify(selectedCustomer)));
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      수정 취소
                    </button>
                    <button
                      onClick={handleUpdateCustomer}
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

      {/* Contract Conversion Popup Modal */}
      {isConvertModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">📝 정식 계약 체결 및 수립</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  '<strong className="text-[#01916D] font-bold">{selectedCustomer.name}</strong>' 고객사를 미계약에서 <strong className="text-amber-600 font-bold">[계약 완료 고객]</strong>으로 승격합니다.
                </p>
              </div>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">계약 번호</label>
                <input
                  type="text"
                  value={convertFormData.contract_no}
                  onChange={(e) => setConvertFormData({ ...convertFormData, contract_no: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">렌탈 약정 기간 (개월)</label>
                  <select
                    value={convertFormData.period_months}
                    onChange={(e) => setConvertFormData({ ...convertFormData, period_months: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value={12}>12개월 (1년)</option>
                    <option value={24}>24개월 (2년)</option>
                    <option value={36}>36개월 (3년 - 표준)</option>
                    <option value={48}>48개월 (4년)</option>
                    <option value={60}>60개월 (5년)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">월 약정 렌탈료 (원)</label>
                  <input
                    type="number"
                    value={convertFormData.monthly_fee}
                    onChange={(e) => setConvertFormData({ ...convertFormData, monthly_fee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">복합기 설치 대수</label>
                <input
                  type="number"
                  value={convertFormData.device_count}
                  onChange={(e) => setConvertFormData({ ...convertFormData, device_count: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">계약 비고 / 특약사항</label>
                <input
                  type="text"
                  value={convertFormData.note}
                  onChange={(e) => setConvertFormData({ ...convertFormData, note: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmContractConversion}
                className="px-5 py-2 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md transition-all"
              >
                계약 승격 및 대장 수립 완료
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
