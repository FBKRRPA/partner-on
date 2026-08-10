"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AppFooter } from "../../../components/layout/AppFooter";
import { MemberManagement } from "../../../components/MemberManagement";

export default function CrmMembersPage() {
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("partneron.accessToken") ||
      "";
    setAccessToken(token);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#333333] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Breadcrumb (Matches Contracts Page Exactly) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C] mb-2">
            <span>CRM SYSTEM</span>
            <span>&rsaquo;</span>
            <span className="text-[#01916D] font-bold">구성원 관리</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#333333] tracking-tight">
                소속 구성원 계정 및 승인 기기 통제 관리
              </h1>
              <p className="text-sm text-[#5C5C5C] mt-1">
                소속 사업장의 사원 계정 추가, 직급 관리, 2FA 보안 정책 및 대표 승인 기기 통제를 관리합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Member Management Core Component (Matched Page Standard) */}
        {accessToken ? (
          <MemberManagement accessToken={accessToken} />
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm font-bold bg-white rounded-2xl border border-slate-200 shadow-sm">
            구성원 관리 데이터를 불러오는 중...
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
