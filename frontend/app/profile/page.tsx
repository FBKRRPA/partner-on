"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { AppFooter } from "../../components/layout/AppFooter";
import {
  getMyProfile,
  updateMyProfile,
  setupTOTP,
  verifySetupTOTP,
  toggle2FA,
  DeviceDto,
  MemberDto,
} from "../../lib/auth-api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<MemberDto | null>(null);
  const [myDevices, setMyDevices] = useState<DeviceDto[]>([]);
  const [token, setToken] = useState<string>("");

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [backupCodesCount, setBackupCodesCount] = useState(0);

  // TOTP setup modal state
  const [showTOTPModal, setShowTOTPModal] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [otpAuthUrl, setOtpAuthUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpInputCode, setTotpInputCode] = useState("");
  const [totpModalMsg, setTotpModalMsg] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

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
      const res = await getMyProfile(authToken);
      setUser(res.user);
      setMyDevices(res.my_devices);
      setIs2FAEnabled(res.is_2fa_enabled);
      setRequires2FA(res.requires_2fa);
      setBackupCodesCount(res.backup_codes_count);
      sessionStorage.setItem("user", JSON.stringify(res.user));
    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : "프로필 정보를 불러오지 못했습니다.");
      setIsError(true);
    } finally {
      setFetching(false);
    }
  }

  async function handleToggle2FA() {
    if (!token) return;
    try {
      setLoading(true);
      setMessage("");
      setIsError(false);

      const res = await toggle2FA(token, !is2FAEnabled);
      setIs2FAEnabled(res.is_2fa_enabled);
      setMessage(res.detail);
      if (res.backup_codes && res.backup_codes.length > 0) {
        setBackupCodes(res.backup_codes);
        setShowBackupModal(true);
      }
      await loadProfile(token);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "2FA 설정 변경 중 오류 발생");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenTOTPSetup() {
    if (!token) return;
    try {
      setLoading(true);
      const res = await setupTOTP(token);
      setTotpSecret(res.secret);
      setOtpAuthUrl(res.otpauth_url);
      setQrCodeUrl(res.qr_code_url || "");
      setTotpInputCode("");
      setTotpModalMsg("");
      setShowTOTPModal(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "TOTP 설정 조회 실패");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyTOTP(e: FormEvent) {
    e.preventDefault();
    if (!token || !totpInputCode) return;
    try {
      setLoading(true);
      setTotpModalMsg("");
      const res = await verifySetupTOTP(token, totpInputCode);
      setShowTOTPModal(false);
      setIs2FAEnabled(true);
      setMessage(res.detail);
      if (res.backup_codes) {
        setBackupCodes(res.backup_codes);
        setShowBackupModal(true);
      }
      await loadProfile(token);
    } catch (err) {
      setTotpModalMsg(err instanceof Error ? err.message : "검증 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

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
        {/* Header Component */}
        <AppHeader workplaceName={workplaceName} onLogout={handleLogout} />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#333333] tracking-tight">
              내 프로필 설정
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1">
              내 계정 정보 조회, 이름 및 비밀번호 변경, 2차 인증(2FA) 설정 및 접속 기기를 관리할 수 있습니다.
            </p>
          </div>

          {/* Alert Message */}
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

          {/* User Information Card & Edit Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Account Summary Badge */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#01916D]/10 border border-[#01916D]/30 flex items-center justify-center text-2xl font-black text-[#01916D]">
                  {user.name[0] || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#333333]">{user.name}</h2>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{user.email}</p>
                </div>
                <div className="pt-2 space-y-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">소속 사업장:</span>
                    <span className="font-semibold text-slate-800">{workplaceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">직책 권한:</span>
                    <span className="font-bold text-[#01916D]">
                      {user.role === "OWNER" ? "대표 (OWNER)" : user.role === "MANAGER" ? "매니저" : "사원"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                Partner On Secure Profile
              </div>
            </div>

            {/* Right: Update Form */}
            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#333333] border-b border-slate-100 pb-3">
                프로필 정보 수정
              </h3>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">이메일 주소</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">이메일 주소는 보안상 변경이 불가합니다.</p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    이름
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
                  requires2FA
                    ? "bg-emerald-100 text-[#01916D]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {requires2FA ? "🔒 2FA 필수 적용 중" : "🔓 2FA 선택 사용 중"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2FA Toggle */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">2FA 2차 인증 활성화</span>
                    <button
                      onClick={handleToggle2FA}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        is2FAEnabled ? "bg-[#01916D]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          is2FAEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    계정 로그인 시 OTP 번호로 본인 확인을 거쳐 무단 접속을 강력히 통제합니다.
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

          {/* My Registered / Approved Devices */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#333333]">내 접속 등록 기기</h3>
                <p className="text-xs text-slate-500 mt-0.5">내가 승인받았거나 접속 요청한 기기 목록입니다.</p>
              </div>
              <span className="text-xs font-bold text-[#01916D] bg-[#01916D]/10 px-3 py-1 rounded-full">
                총 {myDevices.length}대 기기
              </span>
            </div>

            {myDevices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                등록된 접속 기기가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">기기 명칭</th>
                      <th className="py-3 px-4">승인 상태</th>
                      <th className="py-3 px-4">최초 요청 일시</th>
                      <th className="py-3 px-4">최종 승인 일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myDevices.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">{d.device_name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              d.status === "APPROVED"
                                ? "bg-emerald-100 text-[#01916D]"
                                : d.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-[#E01E35]"
                            }`}
                          >
                            {d.status === "APPROVED"
                              ? "✅ 승인 완료"
                              : d.status === "PENDING"
                              ? "⏳ 승인 대기"
                              : "❌ 승인 거절"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-500">
                          {new Date(d.requested_at).toLocaleString("ko-KR")}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-500">
                          {d.approved_at ? new Date(d.approved_at).toLocaleString("ko-KR") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* TOTP Setup Modal */}
      {showTOTPModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-slate-800">📲 TOTP 인증 앱 설정</h3>
              <p className="text-xs text-slate-500">
                인증 앱(Google Authenticator, Authy 등)으로 아래 QR코드를 스캔해 주세요.
              </p>
            </div>

            {/* QR Code Display Section */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-600">📷 카메라로 QR 코드 스캔</span>
              {qrCodeUrl ? (
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48 object-contain" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-400">
                  QR 코드 로딩 중...
                </div>
              )}
              <p className="text-[11px] text-slate-400 text-center">
                스캔이 불가능한 경우 아래 Secret Key를 직접 입력해 주세요.
              </p>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">보안 Secret Key (수동 등록용)</span>
              <div className="font-mono text-sm font-bold text-[#01916D] tracking-widest select-all">
                {totpSecret}
              </div>
            </div>

            <form onSubmit={handleVerifyTOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  앱에 표시된 6자리 핀 코드 입력
                </label>
                <input
                  type="text"
                  value={totpInputCode}
                  onChange={(e) => setTotpInputCode(e.target.value)}
                  placeholder="예: 582910"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-center font-bold text-lg tracking-widest focus:outline-none focus:border-[#01916D]"
                />
              </div>

              {totpModalMsg && (
                <div className="p-3 bg-rose-50 text-[#E01E35] text-xs font-bold rounded-xl text-center">
                  {totpModalMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  확인 및 2FA 활성화
                </button>
                <button
                  type="button"
                  onClick={() => setShowTOTPModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Backup Codes Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-2xl font-bold border border-amber-200">
                🔑
              </div>
              <h3 className="text-xl font-bold text-slate-800">비상 복구 코드 (10개)</h3>
              <p className="text-xs text-slate-500">
                인증 앱이나 이메일을 사용할 수 없을 때 비상 접속에 사용되는 일회용 복구 코드입니다. 안전한 곳에 보관하세요!
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 font-mono text-xs font-bold text-slate-800 text-center select-all">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200">
                  {code}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowBackupModal(false)}
              className="w-full py-3 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              복구 코드를 안전하게 보관했습니다
            </button>
          </div>
        </div>
      )}

      {/* Common Footer */}
      <AppFooter />
    </div>
  );
}
