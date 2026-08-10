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

  // Initial Sample Customers Data
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

  // Modal Form State (5 Sections Full Fields)
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

    // 로그인한 유저의 회사명(Workplace) 및 실명 가져오기
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

    // Reset Form
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
                고객사 마스터 관리
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                테이블 행(Row) 클릭 시 고객사 5대 섹션 전수 상세 정보가 팝업 노출됩니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="고객명, 담당자, 사업자번호 검색"
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-[#01916D] w-64"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                + 신규 고객사 등록 팝업
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
                  <th className="p-4">관리 파트너사 / 사원</th>
                  <th className="p-4">고객명</th>
                  <th className="p-4">사무실유형 / 거점</th>
                  <th className="p-4">사업자번호</th>
                  <th className="p-4 text-center">계약상태</th>
                  <th className="p-4 text-center">등급 / 규모</th>
                  <th className="p-4">주 담당자 (담당자 1)</th>
                  <th className="p-4 text-center">상세보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleRowClick(c)}
                    className="hover:bg-slate-100/80 transition-all cursor-pointer"
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300 text-[#01916D]" />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{c.partner_company}</div>
                      <div className="text-[11px] text-slate-500">{c.partner_employee}</div>
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
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(c)}
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

      {/* 5-SECTION FULL CREATION MODAL POPUP */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  신규 고객사 팝업 등록
                </span>
                <h2 className="text-lg font-black text-slate-900">고객사 5대 섹션 마스터 정보 입력</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* 1) 관리파트너사정보 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  1) 관리 파트너사 정보 (소속 사업장)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      관리 파트너사 (소속 사업장명)
                    </label>
                    <input
                      type="text"
                      value={formData.partner_company}
                      onChange={(e) => setFormData({ ...formData, partner_company: e.target.value })}
                      placeholder="로그인 유저 소속 사업장명"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      담당사원 (로그인 유저)
                    </label>
                    <input
                      type="text"
                      value={formData.partner_employee}
                      onChange={(e) => setFormData({ ...formData, partner_employee: e.target.value })}
                      placeholder="로그인 유저 실명"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 2) 고객정보 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  2) 고객 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객명 (필수)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="고객사 상호명"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">사업자등록번호</label>
                    <input
                      type="text"
                      value={formData.biz_no}
                      onChange={(e) => setFormData({ ...formData, biz_no: e.target.value })}
                      placeholder="000-00-00000"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">거점</label>
                    <input
                      type="text"
                      value={formData.location_base}
                      onChange={(e) => setFormData({ ...formData, location_base: e.target.value })}
                      placeholder="서울 본사 / 판교 센터 등"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">고객 사무실 유형</label>
                    <select
                      value={formData.office_type}
                      onChange={(e) => setFormData({ ...formData, office_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
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
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
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
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
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
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
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
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  3) 고객 담당자 정보 1 (주 담당자)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">담당자</label>
                    <input
                      type="text"
                      value={formData.contact1.name}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, name: e.target.value } })}
                      placeholder="성함"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">담당자 부서</label>
                    <select
                      value={formData.contact1.department}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, department: e.target.value } })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
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
                      placeholder="팀장, 대리 등"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">이메일</label>
                    <input
                      type="email"
                      value={formData.contact1.email}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, email: e.target.value } })}
                      placeholder="user@domain.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.contact1.phone}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, phone: e.target.value } })}
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">기타 참고사항</label>
                    <input
                      type="text"
                      value={formData.contact1.note}
                      onChange={(e) => setFormData({ ...formData, contact1: { ...formData.contact1, note: e.target.value } })}
                      placeholder="특이사항 메모"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 4) 고객 담당자 정보 2 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  4) 고객 담당자 정보 2
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="담당자2 이름"
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
                    placeholder="연락처 (010-0000-0000)"
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
                    placeholder="기타"
                    value={formData.contact2.note}
                    onChange={(e) => setFormData({ ...formData, contact2: { ...formData.contact2, note: e.target.value } })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* 5) 고객 담당자 정보 3 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  5) 고객 담당자 정보 3
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="담당자3 이름"
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
                    placeholder="연락처 (010-0000-0000)"
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
                    placeholder="기타"
                    value={formData.contact3.note}
                    onChange={(e) => setFormData({ ...formData, contact3: { ...formData.contact3, note: e.target.value } })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveCustomer}
                className="px-6 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                고객사 저장 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Click Customer Full Detail Modal Popup */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#01916D] uppercase tracking-wider block">
                  고객사 5대 섹션 상세보기
                </span>
                <h2 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h2>
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
                  1) 관리 파트너사 정보 (소속 사업장)
                </h3>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div><span className="text-slate-400">관리 파트너사 (소속 사업장명):</span> <strong className="text-slate-900 font-bold">{selectedCustomer.partner_company}</strong></div>
                  <div><span className="text-slate-400">담당사원 (로그인 유저):</span> <strong className="text-slate-900 font-bold">{selectedCustomer.partner_employee}</strong></div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  2) 고객 정보
                </h3>
                <div className="grid grid-cols-3 gap-4 pt-1">
                  <div><span className="text-slate-400">고객명:</span> <strong className="text-slate-900">{selectedCustomer.name}</strong></div>
                  <div><span className="text-slate-400">사업자번호:</span> <strong className="font-mono text-slate-900">{selectedCustomer.biz_no || "-"}</strong></div>
                  <div><span className="text-slate-400">거점:</span> <strong className="text-slate-900">{selectedCustomer.location_base}</strong></div>
                  <div><span className="text-slate-400">사무실 유형:</span> <strong className="text-slate-900">{selectedCustomer.office_type}</strong></div>
                  <div><span className="text-slate-400">계약상태:</span> <strong className="text-[#01916D]">{selectedCustomer.contract_status}</strong></div>
                  <div><span className="text-slate-400">관리등급:</span> <strong className="text-slate-900">{selectedCustomer.grade} 등급</strong></div>
                  <div className="col-span-3"><span className="text-slate-400">고객사 규모(임직원):</span> <strong className="text-slate-900">{selectedCustomer.company_scale} 명</strong></div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  3) 고객 주 담당자 정보 (담당자 1)
                </h3>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div><span className="text-slate-400">성함 / 직책:</span> <strong className="text-slate-900">{selectedCustomer.contact1.name} {selectedCustomer.contact1.position}</strong></div>
                  <div><span className="text-slate-400">부서:</span> <strong className="text-slate-900">{selectedCustomer.contact1.department}</strong></div>
                  <div><span className="text-slate-400">연락처:</span> <strong className="font-mono text-slate-900">{selectedCustomer.contact1.phone}</strong></div>
                  <div className="col-span-2"><span className="text-slate-400">이메일:</span> <strong className="font-mono text-slate-900">{selectedCustomer.contact1.email}</strong></div>
                  <div className="col-span-3"><span className="text-slate-400">기타 메모:</span> <span className="text-slate-800">{selectedCustomer.contact1.note || "-"}</span></div>
                </div>
              </div>

              {/* Section 4 & 5 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-extrabold text-[#01916D] uppercase tracking-wider">
                  4) 고객 담당자 정보 2 & 5) 고객 담당자 정보 3 (보조 담당자)
                </h3>
                {selectedCustomer.contact2 && selectedCustomer.contact2.name ? (
                  <div className="border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 block mb-1">[보조 담당자 2]</span>
                    <p>{selectedCustomer.contact2.name} {selectedCustomer.contact2.position} ({selectedCustomer.contact2.phone} | {selectedCustomer.contact2.email})</p>
                  </div>
                ) : <p className="text-slate-400">담당자 2 정보 없음</p>}

                {selectedCustomer.contact3 && selectedCustomer.contact3.name ? (
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">[보조 담당자 3]</span>
                    <p>{selectedCustomer.contact3.name} {selectedCustomer.contact3.position} ({selectedCustomer.contact3.phone} | {selectedCustomer.contact3.email})</p>
                  </div>
                ) : <p className="text-slate-400">담당자 3 정보 없음</p>}
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

      <AppFooter />
    </div>
  );
}
