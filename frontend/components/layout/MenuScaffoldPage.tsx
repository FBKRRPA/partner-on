"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { RoleMenuPermissionDto } from "../../lib/auth-api";

type MenuScaffoldPageProps = {
  category: string;
  title: string;
  description: string;
  icon?: string;
  children?: React.ReactNode;
};

const PATH_TO_KEY_MAP: Record<string, string> = {
  "/profile": "profile",
  "/crm/customers": "crm_customers",
  "/crm/sales": "crm_sales",
  "/crm/members": "crm_members",
  "/operations/basic/dashboard": "basic_dashboard",
  "/operations/basic/workplaces": "basic_workplaces",
  "/operations/basic/warehouses": "basic_warehouses",
  "/operations/basic/models": "basic_models",
  "/operations/basic/consumable-codes": "basic_consumable_codes",
  "/operations/basic/contracts": "basic_contracts",
  "/operations/basic/permissions": "basic_permissions",
  "/operations/assets/devices": "assets_devices",
  "/operations/assets/in-out": "assets_in_out",
  "/operations/assets/inventory": "assets_inventory",
  "/operations/assets/collectors": "assets_collectors",
  "/operations/assets/email-collectors": "assets_email_collectors",
  "/operations/monitoring/usage": "monitoring_usage",
  "/operations/monitoring/supplies": "monitoring_supplies",
  "/operations/monitoring/customers": "monitoring_customers",
  "/operations/monitoring/as/today": "monitoring_as_today",
  "/operations/monitoring/as/tickets": "monitoring_as_tickets",
  "/operations/monitoring/consumables-usage": "monitoring_consumables_usage",
  "/operations/contracts/uncontracted": "contracts_uncontracted",
  "/operations/contracts/list": "contracts_list",
  "/operations/contracts/invoices": "contracts_invoices",
  "/operations/contracts/sales": "contracts_sales",
};

export function MenuScaffoldPage({
  category,
  title,
  description,
  icon = "📌",
  children,
}: MenuScaffoldPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [workplaceName, setWorkplaceName] = useState("");
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    const rawUser = sessionStorage.getItem("user") || sessionStorage.getItem("partneron.user");
    const rawPerms = sessionStorage.getItem("partneron.permissions");

    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u.workplace?.name) setWorkplaceName(u.workplace.name);

        const userRole = u.role;
        const currentMenuKey = pathname ? PATH_TO_KEY_MAP[pathname] : undefined;

        // OWNER is always authorized
        if (userRole !== "OWNER" && currentMenuKey && rawPerms) {
          const perms: RoleMenuPermissionDto[] = JSON.parse(rawPerms);
          const match = perms.find((p) => p.role === userRole && p.menu_key === currentMenuKey);
          if (match && match.is_allowed === false) {
            setAuthorized(false);
            router.replace("/dashboard");
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [pathname, router]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  if (!authorized) {
    return null; // Don't render content if unauthorized
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <AppHeader workplaceName={workplaceName} onLogout={handleLogout} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Breadcrumb & Category Badge */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#01916D]/10 text-[#01916D] font-bold text-xs">
              <span>{category}</span>
              <span>›</span>
              <span>{title}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#333333] tracking-tight flex items-center gap-2">
              <span>{icon}</span>
              <span>{title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C]">{description}</p>
          </div>

          {/* Interactive Feature Children or Default Scaffold Card */}
          {children ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
              {children}
            </div>
          ) : (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-[#01916D]/10 border border-[#01916D]/30 flex items-center justify-center text-4xl mx-auto shadow-xs">
                {icon}
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl font-bold text-slate-800">
                  {title} 서비스 대시보드
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  현재 <strong>{category} › {title}</strong> 모듈이 연결되어 있습니다.
                  실시간 통합 관리 기능 및 세부 데이터가 이곳에 표시됩니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-left">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">데이터 수집 상태</div>
                  <div className="text-sm font-bold text-[#01916D] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#01916D] animate-ping" />
                    실시간 정상 동기화
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">보안 관리 수준</div>
                  <div className="text-sm font-bold text-[#01916D]">최상 (RBAC 통제)</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">권한 세션</div>
                  <div className="text-sm font-bold text-slate-800">인증됨 (JWT)</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
