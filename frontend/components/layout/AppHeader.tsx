"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderLogo } from "./HeaderLogo";
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import { getMenuPermissions, RoleMenuPermissionDto } from "../../lib/auth-api";

type SubMenuItem = {
  name: string;
  href: string;
  badge?: string;
  key?: string;
};

type MenuItem = {
  name: string;
  href?: string;
  key?: string;
  children?: SubMenuItem[];
};

type AppHeaderProps = {
  workplaceName?: string;
  onLogout?: () => void;
  isLanding?: boolean;
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

export function AppHeader({ workplaceName, onLogout, isLanding = false }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [userRole, setUserRole] = useState<string>("");
  const [permissions, setPermissions] = useState<RoleMenuPermissionDto[]>([]);

  useEffect(() => {
    const rawUser = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("accessToken") || "";
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u.role) setUserRole(u.role);
      } catch (e) {
        console.error(e);
      }
    }
    if (token) {
      getMenuPermissions(token)
        .then((perms) => {
          setPermissions(perms || []);
          sessionStorage.setItem("partneron.permissions", JSON.stringify(perms || []));
        })
        .catch(() => {});
    }
  }, []);

  const masterMenuTree: MenuItem[] = [
    {
      name: "홈",
      href: "/dashboard",
      key: "dashboard",
    },
    {
      name: "CRM",
      children: [
        { name: "고객관리", href: "/crm/customers", key: "crm_customers" },
        { name: "영업관리", href: "/crm/sales", key: "crm_sales" },
        { name: "구성원관리", href: "/crm/members", badge: "보안강화", key: "crm_members" },
      ],
    },
    {
      name: "기초정보",
      children: [
        { name: "대시보드", href: "/operations/basic/dashboard", key: "basic_dashboard" },
        { name: "관리 사업자", href: "/operations/basic/workplaces", key: "basic_workplaces" },
        { name: "창고", href: "/operations/basic/warehouses", key: "basic_warehouses" },
        { name: "사용자 정의 모델", href: "/operations/basic/models", key: "basic_models" },
        { name: "부소모품 코드", href: "/operations/basic/consumable-codes", key: "basic_consumable_codes" },
        { name: "고객(계약후)", href: "/operations/basic/contracts", key: "basic_contracts" },
        { name: "메뉴 권한 관리", href: "/operations/basic/permissions", badge: "관리자전용", key: "basic_permissions" },
      ],
    },
    {
      name: "자산/수집",
      children: [
        { name: "장비현황", href: "/operations/assets/devices", key: "assets_devices" },
        { name: "부소모품 입출고", href: "/operations/assets/in-out", key: "assets_in_out" },
        { name: "부소모품 재고", href: "/operations/assets/inventory", key: "assets_inventory" },
        { name: "장비관리 (수집장비)", href: "/operations/assets/collectors", key: "assets_collectors" },
        { name: "메일수집 장비등록", href: "/operations/assets/email-collectors", key: "assets_email_collectors" },
      ],
    },
    {
      name: "모니터링/AS",
      children: [
        { name: "사용량", href: "/operations/monitoring/usage", key: "monitoring_usage" },
        { name: "소모품", href: "/operations/monitoring/supplies", key: "monitoring_supplies" },
        { name: "고객현황", href: "/operations/monitoring/customers", key: "monitoring_customers" },
        { name: "오늘의 A/S (모바일용)", href: "/operations/monitoring/as/today", badge: "Mobile", key: "monitoring_as_today" },
        { name: "A/S 접수 · 진행 · 완료", href: "/operations/monitoring/as/tickets", key: "monitoring_as_tickets" },
        { name: "부소모품 사용 현황", href: "/operations/monitoring/consumables-usage", key: "monitoring_consumables_usage" },
      ],
    },
    {
      name: "계약",
      children: [
        { name: "계약 등록", href: "/operations/contracts/uncontracted", key: "contracts_uncontracted" },
        { name: "계약 목록", href: "/operations/contracts/list", key: "contracts_list" },
        { name: "명세서 발행/완료", href: "/operations/contracts/invoices", key: "contracts_invoices" },
        { name: "판매 등록/완료", href: "/operations/contracts/sales", key: "contracts_sales" },
      ],
    },
    {
      name: "프로필",
      href: "/profile",
      key: "profile",
    },
  ];

  // Helper to check if a specific menu key is allowed for current user role
  const isMenuKeyAllowed = (menuKey?: string) => {
    if (!menuKey || menuKey === "dashboard") return True;
    if (userRole === "OWNER") return True; // OWNER is always allowed
    if (menuKey === "basic_permissions" && userRole !== "ADMIN_STAFF") return False;

    // Check DB permissions for ADMIN_STAFF, SALES, CE
    const match = permissions.find((p) => p.role === userRole && p.menu_key === menuKey);
    return match ? match.is_allowed : True; // Default allowed if not explicitly disabled
  };

  function True(): boolean { return true; }
  function False(): boolean { return false; }

  // Filter out disallowed submenus and categories entirely
  const filteredNavItems = isLanding
    ? []
    : masterMenuTree
        .map((category) => {
          if (!category.children) {
            // Single menu (e.g. Home, Profile)
            return isMenuKeyAllowed(category.key) ? category : null;
          }

          // Filter children submenus
          const allowedChildren = category.children.filter((child) => isMenuKeyAllowed(child.key));

          if (allowedChildren.length === 0) return null; // Hide category if no allowed children

          return {
            ...category,
            children: allowedChildren,
          };
        })
        .filter(Boolean) as MenuItem[];

  const handleMouseEnter = (menuName: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(menuName);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const toggleMobileAccordion = (menuName: string) => {
    setMobileExpanded((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = filteredNavItems;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAFAFA]/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Fujifilm Brand Top Gradation Bar */}
      <div className="h-1 fujifilm-gradation-bg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand Component */}
          <Link href={isLanding ? "/" : "/dashboard"} className="flex items-center group shrink-0">
            <HeaderLogo />
          </Link>

          {/* Desktop Top Dropdown Navigation Bar (Disallowed menus hidden) */}
          {navItems.length > 0 && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 relative">
              {navItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isCurrentCategoryActive = hasChildren
                  ? item.children?.some((child) => pathname === child.href)
                  : pathname === item.href;
                const isOpen = activeDropdown === item.name;

                if (!hasChildren && item.href) {
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 ${
                        isCurrentCategoryActive
                          ? "bg-[#01916D]/10 text-[#01916D] shadow-2xs font-extrabold"
                          : "text-[#333333] hover:text-[#01916D] hover:bg-slate-100/80"
                      }`}
                    >
                      <span>{item.name}</span>
                    </Link>
                  );
                }

                return (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(item.name)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => setActiveDropdown(isOpen ? null : item.name)}
                      className={`px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCurrentCategoryActive || isOpen
                          ? "bg-[#01916D]/10 text-[#01916D] shadow-2xs font-extrabold"
                          : "text-[#333333] hover:text-[#01916D] hover:bg-slate-100/80"
                      }`}
                    >
                      <span>{item.name}</span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#01916D]" : "text-slate-400"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Mega Dropdown Layer Panel */}
                    {isOpen && (
                      <div
                        className="absolute left-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseEnter={() => handleMouseEnter(item.name)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="px-4 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <span>{item.name} 메뉴</span>
                          <span>{item.children?.length}개 항목</span>
                        </div>
                        {item.children?.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm font-bold transition-all hover:bg-emerald-50/80 ${
                                isChildActive
                                  ? "text-[#01916D] bg-[#01916D]/10 border-l-4 border-[#01916D]"
                                  : "text-slate-700 hover:text-[#01916D]"
                              }`}
                            >
                              <span>{child.name}</span>
                              {child.badge && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#01916D]">
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          {/* Right Actions (Desktop & Mobile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            <PwaInstallPrompt />

            {workplaceName && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-[#5C5C5C] border border-slate-200">
                🏢 {workplaceName}
              </span>
            )}

            {onLogout ? (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 text-xs font-semibold text-[#5C5C5C] hover:text-[#E01E35] hover:bg-rose-50 rounded-xl transition-all border border-slate-200 hover:border-rose-200 cursor-pointer"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-black hover:text-[#01916D] rounded-xl border border-slate-200 hover:border-[#01916D] transition-all"
              >
                로그인
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            {navItems.length > 0 && (
              <div className="flex items-center lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-[#333333] hover:text-[#01916D] hover:bg-slate-100 focus:outline-none transition-colors ml-1"
                  aria-label="Toggle Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 18h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Accordion Menu (Disallowed menus hidden) */}
      {mobileMenuOpen && navItems.length > 0 && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-2 shadow-xl max-h-[80vh] overflow-y-auto">
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = !!mobileExpanded[item.name];

            if (!hasChildren && item.href) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    pathname === item.href
                      ? "bg-[#01916D]/10 text-[#01916D]"
                      : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            }

            return (
              <div key={item.name} className="border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleMobileAccordion(item.name)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <span>{item.name}</span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="bg-white divide-y divide-slate-100 py-1">
                    {item.children?.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-6 py-2.5 text-xs font-semibold ${
                          pathname === child.href
                            ? "text-[#01916D] font-bold bg-[#01916D]/5"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>{child.name}</span>
                        {child.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#01916D]">
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
