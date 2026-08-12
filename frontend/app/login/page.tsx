"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, login, requestPasswordReset, verify2FA } from "../../lib/auth-api";
import { AppFooter } from "../../components/layout/AppFooter";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams?.get("expired") === "true";
  const returnUrl = searchParams?.get("returnUrl");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Password Reset Modal Form State (Matching User's HTML structure)
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const emailStr = String(form.get("email"));

    try {
      const result = await login({
        email: emailStr,
        password: String(form.get("password")),
      });

      // Check if 2FA verification is required
      if (result.require_2fa) {
        setPendingEmail(emailStr);
        setShow2FAModal(true);
        setOtpError("");
        return;
      }

      // Store tokens and navigate to returnUrl or /dashboard
      if (result.access && result.user) {
        sessionStorage.setItem("accessToken", result.access);
        sessionStorage.setItem("refreshToken", result.refresh || "");
        sessionStorage.setItem("user", JSON.stringify(result.user));
        sessionStorage.setItem("partneron.accessToken", result.access);
        sessionStorage.setItem("partneron.user", JSON.stringify(result.user));
        const destination = returnUrl ? decodeURIComponent(returnUrl) : "/dashboard";
        window.location.href = destination;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify2FASubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpError("");
    setOtpLoading(true);

    try {
      const result = await verify2FA(pendingEmail, otpCode);
      if (result.access && result.user) {
        sessionStorage.setItem("accessToken", result.access);
        sessionStorage.setItem("refreshToken", result.refresh || "");
        sessionStorage.setItem("user", JSON.stringify(result.user));
        sessionStorage.setItem("partneron.accessToken", result.access);
        sessionStorage.setItem("partneron.user", JSON.stringify(result.user));
        const destination = returnUrl ? decodeURIComponent(returnUrl) : "/dashboard";
        window.location.href = destination;
      }
    } catch (caught) {
      setOtpError(caught instanceof Error ? caught.message : "2차 인증 검증에 실패했습니다.");
    } finally {
      setOtpLoading(false);
    }
  }

  // Password Reset: Step 1 - Send Verification OTP
  async function handleSendVerificationCode() {
    if (!resetEmail || !resetEmail.includes("@")) {
      setResetError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      const resDetail = await requestPasswordReset(resetEmail);
      setIsOtpSent(true);
      setResetMessage(resDetail);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setResetLoading(false);
    }
  }

  // Password Reset: Step 2 - Verify OTP Code
  function handleVerifyCode() {
    if (!verificationCode || verificationCode.trim().length < 6) {
      setResetError("6자리 인증번호를 올바르게 입력해 주세요.");
      return;
    }
    setResetError("");
    setIsOtpVerified(true);
    setResetMessage("인증번호가 확인되었습니다. 변경할 비밀번호를 입력해 주세요.");
  }

  // Password Reset: Step 3 - Submit Final Password Reset
  async function handlePasswordResetSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!newPassword || newPassword.length < 8) {
      setResetError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setResetLoading(true);

    try {
      const resDetail = await confirmPasswordReset(resetEmail, verificationCode, newPassword);
      setResetMessage(resDetail);
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail("");
        setVerificationCode("");
        setNewPassword("");
        setConfirmPassword("");
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setResetMessage("");
        setResetError("");
      }, 2000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setResetLoading(false);
    }
  }

  function handleStartUIDemo() {
    const demoUser = {
      id: 999,
      email: "demo@partneron.co.kr",
      name: "타팀 시연용 데모 관리자",
      role: "HEADQUARTERS",
      workplace: { id: 1, name: "PartnerOn UI 데모 본사" },
      is_2fa_enabled: false,
    };
    sessionStorage.setItem("accessToken", "demo-access-token-12345");
    sessionStorage.setItem("refreshToken", "demo-refresh-token-12345");
    sessionStorage.setItem("user", JSON.stringify(demoUser));
    sessionStorage.setItem("partneron.accessToken", "demo-access-token-12345");
    sessionStorage.setItem("partneron.user", JSON.stringify(demoUser));
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between font-sans">
      {/* Top Header Gradation Bar */}
      <div className="h-1.5 fujifilm-gradation-bg" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Background Decorative Glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#01916D]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#00D164]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Clean & Elegant Login Container */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 space-y-8 relative z-10 my-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header & Logo Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <a href="/" className="inline-block transition-transform hover:scale-105">
                <img
                  src="/fujifilm-logo1.png"
                  alt="FUJIFILM Business Innovation"
                  className="h-10 w-auto object-contain mx-auto"
                />
              </a>
            </div>
            <h1 className="text-2xl font-extrabold text-[#333333] tracking-tight">로그인</h1>
          </div>

          {/* Login Form Section */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-slate-800">
                이메일<span className="text-[#E01E35] ml-0.5">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="이메일을 입력하세요"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-slate-800">
                비밀번호<span className="text-[#E01E35] ml-0.5">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Session Expired Alert Message */}
            {isExpired && !error && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800 text-center animate-in fade-in slide-in-from-top-1">
                🔒 보안 정책에 의해 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.
              </div>
            )}

            {/* Alert Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-[#E01E35] text-center">
                {error}
              </div>
            )}

            {/* Action Buttons Section */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>

              {/* UI Demo Mode Bypass Button */}
              <button
                type="button"
                onClick={handleStartUIDemo}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-[#01916D] font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                둘러보기
              </button>
            </div>

              <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="hover:text-[#01916D] transition-colors cursor-pointer"
                >
                  회원가입
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetEmail("");
                    setVerificationCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setIsOtpSent(false);
                    setIsOtpVerified(false);
                    setResetError("");
                    setResetMessage("");
                  }}
                  className="hover:text-[#01916D] transition-colors cursor-pointer"
                >
                  비밀번호 찾기
                </button>
            </div>
          </form>
        </div>
      </main>

      {/* Password Reset Modal Matching Requested HTML Spec */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#333333]">비밀번호 재설정</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>

            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-[#E01E35] text-center">
                {resetError}
              </div>
            )}

            {resetMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#01916D] text-center">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-5 text-xs sm:text-sm">
              {/* Field 1: Email + Send OTP Button */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  이메일<span className="text-[#E01E35] ml-0.5">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder="이메일을 입력해주세요."
                    type="email"
                    name="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isOtpVerified}
                    required
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:border-[#01916D] disabled:bg-slate-100 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={resetLoading || !resetEmail.trim() || isOtpVerified}
                    className="px-4 py-2.5 bg-[#01916D] hover:bg-[#006449] disabled:opacity-40 text-white font-bold text-xs rounded-2xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    {resetLoading ? "발송 중..." : isOtpSent ? "재발송" : "인증하기"}
                  </button>
                </div>
                {!resetEmail && (
                  <span className="block text-[11px] text-slate-400 pl-1">이메일을 입력해주세요.</span>
                )}
              </div>

              {/* Field 2: Verification Code + Confirm Button */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  인증번호 입력<span className="text-[#E01E35] ml-0.5">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder="인증번호를 입력해주세요."
                    type="text"
                    name="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={!isOtpSent || isOtpVerified}
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:border-[#01916D] disabled:bg-slate-100 text-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={!isOtpSent || !verificationCode.trim() || isOtpVerified}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-xs rounded-2xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isOtpVerified ? "확인됨" : "확인"}
                  </button>
                </div>
              </div>

              {/* Field 3: New Password */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  변경할 비밀번호<span className="text-[#E01E35] ml-0.5">*</span>
                </label>
                <input
                  placeholder="비밀번호를 입력해주세요."
                  type="password"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!isOtpVerified}
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:border-[#01916D] disabled:bg-slate-100 text-slate-900"
                />
              </div>

              {/* Field 4: Confirm Password */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  비밀번호 확인<span className="text-[#E01E35] ml-0.5">*</span>
                </label>
                <input
                  placeholder="비밀번호를 다시 입력해주세요."
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!isOtpVerified}
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:border-[#01916D] disabled:bg-slate-100 text-slate-900"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={
                    !isOtpVerified ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    resetLoading
                  }
                  className="w-full py-3.5 px-4 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] disabled:opacity-40 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  {resetLoading ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Verification Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-[#333333]">2차 인증 (2FA) 확인</h3>
              <p className="text-xs text-slate-500">
                보안 강화를 위해 Google OTP 인증 앱의 6자리 코드 또는 이메일로 전송된 핀 코드/비상 복구 코드를 입력해 주세요.
              </p>
            </div>

            <form onSubmit={onVerify2FASubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  인증 코드 (6자리 OTP / 8자리 복구코드)
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="예: 482910 또는 8A2F-9B1C"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 text-center font-mono text-lg tracking-widest font-bold focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 text-slate-900"
                />
              </div>

              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-[#E01E35] text-center">
                  {otpError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={otpLoading || !otpCode.trim()}
                  className="flex-1 py-3.5 bg-[#01916D] hover:bg-[#006449] disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  {otpLoading ? "인증 확인 중..." : "2차 인증 완료"}
                </button>
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>

            <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3">
              인증 코드가 수신되지 않으셨나요? 고객지원센터에 문의하세요.
            </div>
          </div>
        </div>
      )}

      {/* Common Footer */}
      <AppFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-slate-400 text-sm font-semibold">로딩 중...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
