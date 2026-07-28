"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AppFooter } from "../../../components/layout/AppFooter";
import { MemberManagement } from "../../../components/MemberManagement";

type UserProfile = {
  email: string;
  name: string;
  role: string;
  workplace_name?: string;
};

export default function MembersPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("accessToken") || "";
    if (!storedUser) {
      router.push("/login");
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
      setAccessToken(token);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#01916D]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col justify-between">
      <div>
        {/* Common Header */}
        <AppHeader workplaceName={user.workplace_name || "Partner On"} onLogout={handleLogout} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#01916D]/10 text-[#01916D] font-bold text-xs mb-2">
                <span>CRM</span>
                <span>›</span>
                <span>구성원관리</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#333333] tracking-tight">
                구성원 관리
              </h1>
              <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1">
                소속 사업장의 구성원 정보를 조회, 추가, 수정 및 관리할 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-xs font-semibold text-[#5C5C5C] hover:text-[#01916D] bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-[#01916D] transition-all cursor-pointer"
            >
              ← 대시보드로 돌아가기
            </button>
          </div>

          {/* Member Management Component */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <MemberManagement accessToken={accessToken} />
          </div>
        </main>
      </div>

      {/* Common Footer */}
      <AppFooter />
    </div>
  );
}
