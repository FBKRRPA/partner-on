"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { AppFooter } from "../../../../components/layout/AppFooter";
import {
  getMenuPermissions,
  RoleMenuPermissionDto,
  RoleType,
  updateMenuPermissions,
} from "../../../../lib/auth-api";

type MenuDefinition = {
  key: string;
  group: string;
  name: string;
  path: string;
};

const MENU_LIST: MenuDefinition[] = [
  // 1. 프로필
  { key: "profile", group: "1. 프로필", name: "내 프로필 / 2FA 설정", path: "/profile" },

  // 2. CRM
  { key: "crm_customers", group: "2. CRM", name: "고객관리", path: "/crm/customers" },
  { key: "crm_sales", group: "2. CRM", name: "영업관리", path: "/crm/sales" },
  { key: "crm_members", group: "2. CRM", name: "구성원관리", path: "/crm/members" },

  // 3. 기초정보
  { key: "basic_dashboard", group: "3. 기초정보", name: "대시보드", path: "/operations/basic/dashboard" },
  { key: "basic_workplaces", group: "3. 기초정보", name: "관리 사업자", path: "/operations/basic/workplaces" },
  { key: "basic_warehouses", group: "3. 기초정보", name: "창고", path: "/operations/basic/warehouses" },
  { key: "basic_models", group: "3. 기초정보", name: "사용자 정의 모델", path: "/operations/basic/models" },
  { key: "basic_consumable_codes", group: "3. 기초정보", name: "부소모품 코드", path: "/operations/basic/consumable-codes" },
  { key: "basic_contracts", group: "3. 기초정보", name: "계약", path: "/operations/basic/contracts" },
  { key: "basic_permissions", group: "3. 기초정보", name: "메뉴 권한 관리", path: "/operations/basic/permissions" },

  // 4. 자산/수집
  { key: "assets_devices", group: "4. 자산/수집", name: "장비현황", path: "/operations/assets/devices" },
  { key: "assets_in_out", group: "4. 자산/수집", name: "부소모품 입출고", path: "/operations/assets/in-out" },
  { key: "assets_inventory", group: "4. 자산/수집", name: "부소모품 재고", path: "/operations/assets/inventory" },
  { key: "assets_collectors", group: "4. 자산/수집", name: "장비관리 (수집장비)", path: "/operations/assets/collectors" },
  { key: "assets_email_collectors", group: "4. 자산/수집", name: "메일수집 장비등록", path: "/operations/assets/email-collectors" },

  // 5. 모니터링/AS
  { key: "monitoring_usage", group: "5. 모니터링/AS", name: "사용량", path: "/operations/monitoring/usage" },
  { key: "monitoring_supplies", group: "5. 모니터링/AS", name: "소모품", path: "/operations/monitoring/supplies" },
  { key: "monitoring_customers", group: "5. 모니터링/AS", name: "고객현황", path: "/operations/monitoring/customers" },
  { key: "monitoring_as_today", group: "5. 모니터링/AS", name: "오늘의 A/S (모바일용)", path: "/operations/monitoring/as/today" },
  { key: "monitoring_as_tickets", group: "5. 모니터링/AS", name: "A/S 접수 · 진행 · 완료", path: "/operations/monitoring/as/tickets" },
  { key: "monitoring_consumables_usage", group: "5. 모니터링/AS", name: "부소모품 사용 현황", path: "/operations/monitoring/consumables-usage" },

  // 6. 계약
  { key: "contracts_uncontracted", group: "6. 계약", name: "미계약 장비", path: "/operations/contracts/uncontracted" },
  { key: "contracts_list", group: "6. 계약", name: "계약 목록", path: "/operations/contracts/list" },
  { key: "contracts_invoices", group: "6. 계약", name: "명세서 발행/완료", path: "/operations/contracts/invoices" },
  { key: "contracts_sales", group: "6. 계약", name: "판매 등록/완료", path: "/operations/contracts/sales" },
];

export default function RoleMenuPermissionsPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [workplaceName, setWorkplaceName] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleType>("ADMIN_STAFF");
  const [permissionsState, setPermissionsState] = useState<Record<string, Record<string, boolean>>>({
    ADMIN_STAFF: {},
    SALES: {},
    CE: {},
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const rawUser = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("accessToken") || "";
    if (!storedUserValid(rawUser)) {
      router.push("/login");
      return;
    }

    try {
      const u = JSON.parse(rawUser!);
      setWorkplaceName(u.workplace?.name || "Partner On");
      setAccessToken(token);
      loadPermissions(token);
    } catch {
      router.push("/login");
    }
  }, [router]);

  function storedUserValid(raw: string | null): boolean {
    return !!raw;
  }

  async function loadPermissions(token: string) {
    try {
      setLoading(true);
      const data = await getMenuPermissions(token);

      // Initialize default state (all allowed by default)
      const initialState: Record<string, Record<string, boolean>> = {
        ADMIN_STAFF: {},
        SALES: {},
        CE: {},
      };

      ["ADMIN_STAFF", "SALES", "CE"].forEach((role) => {
        MENU_LIST.forEach((m) => {
          initialState[role][m.key] = true;
        });
      });

      // Override with DB values
      data.forEach((p) => {
        if (initialState[p.role]) {
          initialState[p.role][p.menu_key] = p.is_allowed;
        }
      });

      setPermissionsState(initialState);
    } catch (err) {
      console.error(err);
      setMessage("권한 정보를 불러오는 중 오류가 발생했습니다.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(menuKey: string) {
    setPermissionsState((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [menuKey]: !prev[selectedRole]?.[menuKey],
      },
    }));
  }

  function handleToggleGroup(groupName: string, allow: boolean) {
    const groupMenuKeys = MENU_LIST.filter((m) => m.group === groupName).map((m) => m.key);
    setPermissionsState((prev) => {
      const currentRoleState = { ...prev[selectedRole] };
      groupMenuKeys.forEach((key) => {
        currentRoleState[key] = allow;
      });
      return {
        ...prev,
        [selectedRole]: currentRoleState,
      };
    });
  }

  async function handleSavePermissions() {
    try {
      setSaving(true);
      const payloadArr: RoleMenuPermissionDto[] = [];

      ["ADMIN_STAFF", "SALES", "CE"].forEach((r) => {
        const roleKey = r as RoleType;
        Object.entries(permissionsState[roleKey] || {}).forEach(([menuKey, isAllowed]) => {
          payloadArr.push({
            role: roleKey,
            menu_key: menuKey,
            is_allowed: isAllowed,
          });
        });
      });

      const res = await updateMenuPermissions(accessToken, payloadArr);
      setMessage(res.detail || "권한 설정이 저장되었습니다.");
      setIsError(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "권한 저장 실패");
      setIsError(true);
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  const groups = Array.from(new Set(MENU_LIST.map((m) => m.group)));

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <AppHeader workplaceName={workplaceName} onLogout={handleLogout} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Header Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#01916D]/10 text-[#01916D] font-bold text-xs">
                <span>기초정보</span>
                <span>›</span>
                <span>메뉴 권한 관리</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#333333] tracking-tight">
                🛡️ 직급별 메뉴 접근 권한 설정
              </h1>
              <p className="text-xs sm:text-sm text-[#5C5C5C]">
                사업장 관리자 계정에서 <strong>관리자(사무직원)</strong>, <strong>영업</strong>, <strong>CE</strong> 직급별 8대 메뉴 접근 권한을 관리합니다.
              </p>
            </div>

            <button
              onClick={handleSavePermissions}
              disabled={saving || loading}
              className="px-6 py-3 rounded-2xl bg-[#01916D] hover:bg-[#006449] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? "저장 중..." : "💾 권한 설정 저장하기"}
            </button>
          </div>

          {/* Alert Message */}
          {message && (
            <div
              className={`p-4 rounded-2xl text-sm font-bold border shadow-xs ${
                isError
                  ? "bg-rose-50 border-rose-200 text-[#E01E35]"
                  : "bg-emerald-50 border-emerald-200 text-[#01916D]"
              }`}
            >
              {message}
            </div>
          )}

          {/* Role Tabs Selection */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              권한 설정 대상 직급 선택
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedRole("ADMIN_STAFF")}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedRole === "ADMIN_STAFF"
                    ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 font-bold shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="text-sm font-extrabold flex items-center justify-between">
                  <span>💼 관리자 (사무직원)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">ADMIN_STAFF</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">사무 및 행정 서포트 담당 직급</div>
              </button>

              <button
                onClick={() => setSelectedRole("SALES")}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedRole === "SALES"
                    ? "bg-blue-50/80 border-blue-300 text-blue-900 ring-2 ring-blue-500/20 font-bold shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="text-sm font-extrabold flex items-center justify-between">
                  <span>📈 영업</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">SALES</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">고객 파이프라인 및 영업 담당 직급</div>
              </button>

              <button
                onClick={() => setSelectedRole("CE")}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedRole === "CE"
                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="text-sm font-extrabold flex items-center justify-between">
                  <span>🔧 CE (엔지니어)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">CE</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">현장 방문 및 장비 A/S 담당 직급</div>
              </button>
            </div>
          </div>

          {/* Menu Permission Matrix Panel */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm font-bold bg-white rounded-3xl border border-slate-200">
              권한 매트릭스를 불러오는 중...
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((groupName) => {
                const groupMenus = MENU_LIST.filter((m) => m.group === groupName);
                const roleState = permissionsState[selectedRole] || {};
                const allAllowed = groupMenus.every((m) => roleState[m.key] !== false);

                return (
                  <div
                    key={groupName}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
                  >
                    {/* Group Header */}
                    <div className="bg-slate-50/90 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
                      <div className="font-extrabold text-[#333333] text-base flex items-center gap-2">
                        <span>{groupName}</span>
                        <span className="text-xs font-semibold text-slate-400">({groupMenus.length}개 메뉴)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleGroup(groupName, true)}
                          className="px-3 py-1 text-xs font-bold text-[#01916D] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        >
                          전체 허용
                        </button>
                        <button
                          onClick={() => handleToggleGroup(groupName, false)}
                          className="px-3 py-1 text-xs font-bold text-[#E01E35] bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          전체 차단
                        </button>
                      </div>
                    </div>

                    {/* Submenu Item Grid */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupMenus.map((menu) => {
                        const isAllowed = roleState[menu.key] !== false;
                        return (
                          <div
                            key={menu.key}
                            onClick={() => handleToggle(menu.key)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isAllowed
                                ? "bg-white border-slate-200 hover:border-[#01916D]"
                                : "bg-slate-50/60 border-slate-200 opacity-60"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-sm text-slate-800">{menu.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{menu.path}</div>
                            </div>

                            <button
                              type="button"
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ml-3 ${
                                isAllowed ? "bg-[#01916D]" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isAllowed ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
