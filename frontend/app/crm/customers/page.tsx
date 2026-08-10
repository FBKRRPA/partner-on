"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AppFooter } from "../../../components/layout/AppFooter";

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

export default function CrmCustomersPage() {
  const [accessToken, setAccessToken] = useState("");
  const [search, setSearch] = useState("");

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFullDto | null>(null);

  // Sample Customers Data (Consistent with System Standard)
  const [customers, setCustomers] = useState<CustomerFullDto[]>([
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
  ]);

  // Modal Form State (Session Auto-Bound)
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
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);

    const savedWorkplace = sessionStorage.getItem("workplaceName") || "FBKR 파트너스";
    const savedUserName = sessionStorage.getItem("userName") || "김영업 과장";

    setFormData((prev) => ({
      ...prev,
      partner_company: savedWorkplace,
      partner_employee: savedUserName,
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
    setIsDetailModalOpen(true);
  }

  function handleSaveCustomer() {
    if (!formData.name.trim()) {
      alert("고객명을 입력해 주세요.");
      return;
    }
    const newId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
    const newEntry: CustomerFullDto = {
      id: newId,
      ...formData,
    };
    setCustomers([newEntry, ...customers]);
    setIsCreateModalOpen(false);
    alert(`'${formData.name}' 고객사가 성공적으로 등록되었습니다.`);

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

  const deptOptions = [
    "총무", "구매", "회계", "경리", "IT/전산", "인사", "기획", "CS", "영업", "마케팅", "R&D", "디자인", "물류", "기타"
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header Container (Identical to Dashboard / Other Pages) */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-[#01916D] rounded-md p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <span>FUJIFILM BI ON PORTAL</span>
            <span>&rsaquo;</span>
            <span>고객관리</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">고객사 마스터 관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                고객사 마스터 대장 (Customer Master Ledger)
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                후지필름 BI On 파트너사 전용 CRM 고객사 마스터 대장입니다. (5대 섹션 3인 담당자 연동)
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="고객명 / 담당자 / 사업자번호"
                className="px-3 py-2 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-md focus:outline-none focus:bg-white focus:border-[#01916D] w-64"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded-md shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                + 신규 고객사 등록
              </button>
            </div>
          </div>
        </div>

        {/* High-Density Data Grid Section */}
        <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden p-5">
          <div className="border-l-4 border-[#01916D] pl-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase">
              고객사 마스터 리스트 (High-Density Customer Grid)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              관리 파트너사 소속 고객사 및 3인 담당자 통합 관제
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-normal text-slate-800 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-[11px] font-extrabold text-slate-700 uppercase">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">NO</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">관리 파트너사 / 담당사원</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">고객명 (법인/상호)</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">사무실 유형 / 거점</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">사업자등록번호</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">계약상태</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">관리등급 / 규모</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">주 담당자 (담당자 1)</th>
                  <th className="py-2.5 px-3 text-center">상세조회</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleRowClick(c)}
                    className="hover:bg-emerald-50/50 transition-all cursor-pointer"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono border-r border-slate-200">{c.id}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{c.partner_company}</div>
                      <div className="text-[11px] text-slate-500">{c.partner_employee}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#01916D] border-r border-slate-200">{c.name}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <div className="font-semibold text-slate-800">{c.office_type}</div>
                      <div className="text-[11px] text-slate-500">{c.location_base}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 border-r border-slate-200">{c.biz_no || "-"}</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                      {c.contract_status === "계약 고객" ? (
                        <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-emerald-100 text-[#01916D] border border-emerald-300">
                          계약 고객
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          미계약 고객
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                      <div className="font-bold text-slate-900">{c.grade}등급</div>
                      <div className="text-[11px] text-slate-500">{c.company_scale}명</div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">
                        {c.contact1.name} {c.contact1.position} ({c.contact1.department})
                      </div>
                      <div className="font-mono text-slate-500 text-[11px]">
                        {c.contact1.phone} | {c.contact1.email}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(c)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-[11px] rounded border border-slate-300 cursor-pointer"
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

      {/* 5-Section Registration Modal Popup */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-4xl w-full shadow-2xl border border-slate-300 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#01916D] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 block">
                  FUJIFILM BI ON - MASTER REGISTRATION
                </span>
                <h2 className="text-base font-bold">신규 고객사 5대 섹션 마스터 등록</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white hover:text-emerald-200 font-bold text-sm px-2 py-1 cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* 1) 관리 파트너사 정보 */}
              <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] border-l-4 border-[#01916D] pl-2 flex items-center gap-2">
                  1) 관리 파트너사 정보 (소속 사업장)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      관리 파트너사 (소속 사업장명)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.partner_company}
                      className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-800"
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
                      className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 2) 고객 기본 스펙 정보 */}
              <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] border-l-4 border-[#01916D] pl-2 flex items-center gap-2">
                  2) 고객 기본 스펙 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객명 (필수)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="법인 / 상호명"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-[#01916D] focus:ring-1 focus:ring-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">사업자등록번호</label>
                    <input
                      type="text"
                      value={formData.biz_no}
                      onChange={(e) => setFormData({ ...formData, biz_no: e.target.value })}
                      placeholder="000-00-00000"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">거점 (지역/지사)</label>
                    <input
                      type="text"
                      value={formData.location_base}
                      onChange={(e) => setFormData({ ...formData, location_base: e.target.value })}
                      placeholder="서울 본사 / 판교 센터 등"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객 사무실 유형</label>
                    <select
                      value={formData.office_type}
                      onChange={(e) => setFormData({ ...formData, office_type: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#01916D]"
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
              <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-2.5">
                <h3 className="text-xs font-bold text-[#01916D] border-l-4 border-[#01916D] pl-2 flex items-center gap-2">
                  3) 고객 담당자 정보 1 (주 담당자)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">성함</label>
                    <input
                      type="text"
                      value={formData.contact1.name}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, name: e.target.value } })}
                      placeholder="담당자 성함"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">부서</label>
                    <select
                      value={formData.contact1.department}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, department: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">이메일</label>
                    <input
                      type="email"
                      value={formData.contact1.email}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, email: e.target.value } })}
                      placeholder="user@domain.com"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.contact1.phone}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, phone: e.target.value } })}
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">메모</label>
                    <input
                      type="text"
                      value={formData.contact1.note}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, note: e.target.value } })}
                      placeholder="특이사항 메모"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 4 & 5) 보조 담당자 정보 2, 3 */}
              <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-3">
                <h3 className="text-xs font-bold text-[#01916D] border-l-4 border-[#01916D] pl-2 flex items-center gap-2">
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
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="직책"
                      value={formData.contact2.position}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, position: e.target.value } })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="연락처"
                      value={formData.contact2.phone}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, phone: e.target.value } })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                    <input
                      type="email"
                      placeholder="이메일"
                      value={formData.contact2.email}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, email: e.target.value } })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="메모"
                      value={formData.contact2.note}
                      onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, note: e.target.value } })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
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
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="직책"
                      value={formData.contact3.position}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, position: e.target.value } })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="연락처"
                      value={formData.contact3.phone}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, phone: e.target.value } })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                    <input
                      type="email"
                      placeholder="이메일"
                      value={formData.contact3.email}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, email: e.target.value } })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="메모"
                      value={formData.contact3.note}
                      onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, note: e.target.value } })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
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
                onClick={handleSaveCustomer}
                className="px-5 py-2 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded shadow-sm cursor-pointer"
              >
                고객사 마스터 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal Popup */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-3xl w-full shadow-2xl border border-slate-300 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 block">
                  FUJIFILM BI ON - MASTER LEDGER DETAIL
                </span>
                <h2 className="text-base font-bold">{selectedCustomer.name}</h2>
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
                  1) 관리 파트너사 정보 (소속 사업장)
                </h3>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div><span className="text-slate-500">관리 파트너사 (소속 사업장명):</span> <strong className="text-slate-900 font-bold">{selectedCustomer.partner_company}</strong></div>
                  <div><span className="text-slate-500">담당사원 (로그인 유저):</span> <strong className="text-slate-900 font-bold">{selectedCustomer.partner_employee}</strong></div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-[#01916D] text-xs border-l-4 border-[#01916D] pl-2">
                  2) 고객 기본 스펙 정보
                </h3>
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
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-[#01916D] text-xs border-l-4 border-[#01916D] pl-2">
                  3) 주 담당자 정보 (담당자 1)
                </h3>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div><span className="text-slate-500">성함/직책:</span> <strong>{selectedCustomer.contact1.name} {selectedCustomer.contact1.position}</strong></div>
                  <div><span className="text-slate-500">부서:</span> <strong>{selectedCustomer.contact1.department}</strong></div>
                  <div><span className="text-slate-500">연락처:</span> <strong className="font-mono">{selectedCustomer.contact1.phone}</strong></div>
                  <div className="col-span-2"><span className="text-slate-500">이메일:</span> <strong className="font-mono">{selectedCustomer.contact1.email}</strong></div>
                  <div className="col-span-3"><span className="text-slate-500">메모:</span> <span>{selectedCustomer.contact1.note || "-"}</span></div>
                </div>
              </div>

              {/* Section 4 & 5 */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
                <h3 className="font-bold text-[#01916D] text-xs border-l-4 border-[#01916D] pl-2">
                  4 & 5) 보조 담당자 정보 2, 3
                </h3>
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
