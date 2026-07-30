"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AppFooter } from "../../../components/layout/AppFooter";
import { MemberManagement } from "../../../components/MemberManagement";

export default function CrmMembersPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [workplaceName, setWorkplaceName] = useState("");

  useEffect(() => {
    const rawUser = sessionStorage.getItem("user") || sessionStorage.getItem("partneron.user");
    const token = sessionStorage.getItem("accessToken") || sessionStorage.getItem("partneron.accessToken") || "";

    if (!rawUser || !token) {
      router.push("/login");
      return;
    }

    try {
      const u = JSON.parse(rawUser);
      setWorkplaceName(u.workplace?.name || "Partner On");
      setAccessToken(token);
    } catch (e) {
      console.error(e);
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <AppHeader workplaceName={workplaceName} onLogout={handleLogout} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Header Breadcrumb */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#01916D]/10 text-[#01916D] font-bold text-xs">
              <span>CRM</span>
              <span>›</span>
              <span>구성원관리</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#333333] tracking-tight flex items-center gap-2">
              <span>👥</span>
              <span>소속 구성원 및 기기 보안 관리</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C]">
              사업장에 소속된 직원의 계정 추가/수정, 4개 직급 권한 관리, 접속 승인 기기 모듈 및 2FA 보안 정책을 관리합니다.
            </p>
          </div>

          {/* Interactive Member Management Feature Component */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
            {accessToken ? (
              <MemberManagement accessToken={accessToken} />
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm font-bold">
                구성원 관리 데이터를 불러오는 중...
              </div>
            )}
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
