"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { AppFooter } from "../../components/layout/AppFooter";
import {
  DeviceDto,
  getMyProfile,
  MemberDto,
  setupTOTP,
  toggle2FA,
  updateMyProfile,
  verifySetupTOTP,
} from "../../lib/auth-api";

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [user, setUser] = useState<MemberDto | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [devices, setDevices] = useState<DeviceDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // TOTP Modal State
  const [showTOTPModal, setShowTOTPModal] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpCodeInput, setTotpCodeInput] = useState("");
  const [totpError, setTotpError] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken") || sessionStorage.getItem("partneron.accessToken");
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setToken(accessToken);
    loadProfile(accessToken);
  }, [router]);

  async function loadProfile(authToken: string) {
    try {
      setFetching(true);
      const data = await getMyProfile(authToken);
      setUser(data.user);
      setIs2FAEnabled(data.is_2fa_enabled);
      setRequires2FA(data.requires_2fa);
      setDevices(data.my_devices || []);
    } catch (err) {
      console.error(err);
      setMessage("프로필 정보를 불러오는 데 실패했습니다.");
      setIsError(true);
    } finally {
      setFetching(false);
    }
  }

  // Check if 2FA is mandatory by workplace policy for current user role
  const isEnforcedByWorkplace = () => {
    if (!user || !user.workplace) return false;
    const wp = user.workplace;
    if (user.role === "OWNER" && wp.enforce_2fa_owner) return true;
    if (user.role === "ADMIN_STAFF" && wp.enforce_2fa_admin_staff) return true;
    if (user.role === "SALES" && wp.enforce_2fa_sales) return true;
    if (user.role === "CE" && wp.enforce_2fa_ce) return true;
    return false;
  };

  const workplaceEnforced = isEnforcedByWorkplace();
  const effective2FAEnabled = workplaceEnforced || is2FAEnabled;

  async function handleToggle2FA() {
    if (workplaceEnforced) {
      alert("사업장 보안 정책에 의해 해당 직급은 2FA 사용이 강제 적용 중입니다 (개인 해제 불가).");
      return;
    }

    try {
      setLoading(true);
      const nextState = !is2FAEnabled;
      const res = await toggle2FA(token, nextState);
      setIs2FAEnabled(res.is_2fa_enabled);
      setMessage(res.detail);
      setIsError(false);
      if (res.backup_codes && res.backup_codes.length > 0) {
        setBackupCodes(res.backup_codes);
        setShowBackupCodes(true);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "2FA 설정 변경 실패");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenTOTPSetup() {
    try {
      setLoading(true);
      setTotpError("");
      const res = await setupTOTP(token);
      setTotpSecret(res.secret);
      setQrCodeUrl(res.qr_code_url || "");
      setShowTOTPModal(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "TOTP 생성 중 오류 발생");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyTOTP(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setTotpLoading(true);
      setTotpError("");
      const res = await verifySetupTOTP(token, totpCodeInput);
      setIs2FAEnabled(res.is_2fa_enabled);
      setShowTOTPModal(false);
      setMessage(res.detail || "TOTP 2차 인증이 정상적으로 설정되었습니다.");
      setIsError(false);
      if (res.backup_codes && res.backup_codes.length > 0) {
        setBackupCodes(res.backup_codes);
        setShowBackupCodes(true);
      }
    } catch (err) {
      setTotpError(err instanceof Error ? err.message : "인증 번호가 올바르지 않습니다.");
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleUpdateProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const password = String(form.get("password"));

    const payload: { name?: string; password?: string } = {};
    if (name && name !== user?.name) payload.name = name;
    if (password.trim().length >= 8) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setMessage("수정할 정보를 입력하거나 변경해 주세요.");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const res = await updateMyProfile(token, payload);
      setMessage(res.detail || "프로필 정보가 변경되었습니다.");
      setIsError(false);
      setUser(res.user);
      sessionStorage.setItem("user", JSON.stringify(res.user));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "수정에 실패했습니다.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("partneron.accessToken");
    sessionStorage.removeItem("partneron.user");
    router.push("/login");
  };

  if (fetching || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#01916D]"></div>
      </div>
    );
  }

  const workplaceName = user.workplace?.name || "등록 정보 없음";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <AppHeader workplaceName={workplaceName} onLogout={handleLogout} />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#333333] tracking-tight">
              내 프로필 설정
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1">
              내 계정 정보 조회, 이름 및 비밀번호 변경, 2차 인증(2FA) 설정 및 접속 기기를 관리할 수 있습니다.
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl text-sm font-semibold border ${
                isError
                  ? "bg-rose-50 border-rose-200 text-[#E01E35]"
                  : "bg-emerald-50 border-emerald-200 text-[#01916D]"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#01916D]/10 border border-[#01916D]/30 flex items-center justify-center text-2xl font-black text-[#01916D]">
                  {user.name[0] || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#333333]">{user.name}</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">소속 사업장:</span>
                    <span className="font-semibold text-slate-800">{workplaceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">직책 권한:</span>
                    <span className="font-bold text-[#01916D]">
                      {user.role === "OWNER"
                        ? "관리자(대표)"
                        : user.role === "ADMIN_STAFF"
                        ? "관리자(사무직원)"
                        : user.role === "SALES"
                        ? "영업"
                        : "CE"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                Partner On Secure Profile
              </div>
            </div>

            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#333333] border-b border-slate-100 pb-3">
                ✏️ 계정 기본 정보 수정
              </h3>

              <form onSubmit={handleUpdateProfileSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-500 mb-1">
                    이메일 (아이디) - 변경 불가
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    성명 (이름)
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={user.name}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    새 비밀번호 (변경 시에만 8자 이상 입력)
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="변경을 원할 때만 입력하세요"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 transition-all text-slate-900"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#01916D] hover:bg-[#006449] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {loading ? "저장 중..." : "변경 사항 저장"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 2FA Security Settings Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#333333]">🔐 2차 인증 (2FA) 보안 설정</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  로그인 시 Google Authenticator 인증 앱 또는 이메일 OTP 코드로 2차 검증을 진행합니다.
                </p>
              </div>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  workplaceEnforced || requires2FA
                    ? "bg-emerald-100 text-[#01916D]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {workplaceEnforced
                  ? "🔒 회사 정책 적용 중"
                  : requires2FA
                  ? "🔒 2FA 필수 적용 중"
                  : "🔓 2FA 선택 사용 중"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2FA Toggle (Disabled when Workplace Policy is Enforced) */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">2FA 2차 인증 활성화</span>
                    <button
                      onClick={handleToggle2FA}
                      disabled={loading || workplaceEnforced}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        workplaceEnforced
                          ? "bg-[#01916D] opacity-75 cursor-not-allowed"
                          : is2FAEnabled
                          ? "bg-[#01916D] cursor-pointer"
                          : "bg-slate-300 cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          effective2FAEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {workplaceEnforced ? (
                      <span className="text-[#01916D] font-bold">
                        🔒 사업장 보안 정책에 의해 {user.role === "OWNER" ? "관리자(대표)" : user.role === "ADMIN_STAFF" ? "관리자(사무직원)" : user.role === "SALES" ? "영업" : "CE"} 직급은 2FA 사용이 적용되어 해제할 수 없습니다.
                      </span>
                    ) : (
                      "계정 로그인 시 OTP 번호로 본인 확인을 거쳐 무단 접속을 강력히 통제합니다."
                    )}
                  </p>
                </div>
              </div>

              {/* TOTP Authenticator Setup */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-sm">Google Authenticator 인증 앱 등록</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Google Authenticator 또는 Authy 앱과 연동하여 6자리 TOTP 보안 코드를 생성합니다.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleOpenTOTPSetup}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    📲 TOTP 인증 앱 설정
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Recovery Codes Modal */}
          {showBackupCodes && (
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-900 text-sm">⚠️ 일회성 비상 복구 코드 (Backup Codes)</h4>
                <button
                  onClick={() => setShowBackupCodes(false)}
                  className="text-xs text-amber-700 hover:text-amber-950 font-bold"
                >
                  ✕ 닫기
                </button>
              </div>
              <p className="text-xs text-amber-800">
                인증 앱을 사용할 수 없을 때 계정을 복구할 수 있는 일회성 번호 10개입니다. 안전한 곳에 보관하세요.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg font-mono text-center text-xs font-bold text-slate-800 border border-amber-200">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registered Devices List Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-[#333333] border-b border-slate-100 pb-3">
              📱 내 접속 등록 기기 목록 ({devices.length})
            </h3>
            {devices.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                등록된 접속 기기가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {devices.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <div className="font-bold text-slate-800">{d.device_name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">UUID: {d.device_uuid}</div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        d.status === "APPROVED"
                          ? "bg-emerald-100 text-[#01916D]"
                          : d.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-[#E01E35]"
                      }`}
                    >
                      {d.status === "APPROVED" ? "✅ 승인됨" : d.status === "PENDING" ? "⏳ 대기중" : "❌ 거절됨"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* TOTP Setup Modal */}
      {showTOTPModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#333333]">📲 Google TOTP 인증 앱 스캔</h3>
              <button
                onClick={() => setShowTOTPModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-600">
                Google Authenticator 앱을 실행하여 아래 QR 코드를 스캔하세요.
              </p>

              {qrCodeUrl && (
                <div className="inline-block p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48 mx-auto" />
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-400">수동 입력 시크릿 키</div>
                <div className="font-mono font-bold text-xs text-[#01916D] select-all">{totpSecret}</div>
              </div>
            </div>

            <form onSubmit={handleVerifyTOTP} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  인증 앱에 표시된 6자리 코드 입력
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={totpCodeInput}
                  onChange={(e) => setTotpCodeInput(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-mono text-lg font-bold focus:outline-none focus:border-[#01916D]"
                />
              </div>

              {totpError && <div className="text-xs font-bold text-[#E01E35] text-center">{totpError}</div>}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTOTPModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={totpLoading}
                  className="px-4 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {totpLoading ? "검증 중..." : "등록 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
