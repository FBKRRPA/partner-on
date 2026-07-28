"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { AppFooter } from "../../components/layout/AppFooter";
import { MenuScaffoldPage } from "../../components/layout/MenuScaffoldPage";

type UserProfile = {
  email: string;
  name: string;
  role: string;
  workplace_name?: string;
  workplace?: {
    id: number;
    name: string;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  <MenuScaffoldPage
        category="CRM"
        title="영업관리"
        description="영업 기회 파이프라인, 제안서, 견적 및 판매 진행 상황을 추적합니다."
        icon="📈"
      />
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("partneron.accessToken");
    sessionStorage.removeItem("partneron.user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#01916D]"></div>
      </div>
    );
  }

  // Fallback check for workplace name
  const workplaceName = user.workplace?.name || user.workplace_name || "등록 정보 없음";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col justify-between">
      <div>
        {/* Fujifilm Branded Common Header */}
        <AppHeader workplaceName={workplaceName} onLogout={handleLogout} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Welcome Banner */}
          <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#01916D] p-8 text-white shadow-xl overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#96FFFD] bg-white/10 px-3 py-1 rounded-full border border-white/20">
                Partner On Dashboard
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {user.name}님, 환영합니다!
              </h1>
              <p className="text-white/80 text-sm sm:text-base font-light">
                소속 사업장: <span className="font-semibold text-white">{workplaceName}</span> | 권한:{" "}
                <span className="font-semibold text-[#96FFFD]">{user.role}</span>
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Common Footer */}
      <AppFooter />
    </div>
  );
}
