"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmPasswordReset, login, requestPasswordReset, verify2FA } from "../../lib/auth-api";
import { AppFooter } from "../../components/layout/AppFooter";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtpCode, setResetOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
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

      // Store tokens and navigate
      if (result.access && result.user) {
        sessionStorage.setItem("accessToken", result.access);
        sessionStorage.setItem("refreshToken", result.refresh || "");
        sessionStorage.setItem("user", JSON.stringify(result.user));
        sessionStorage.setItem("partneron.accessToken", result.access);
        sessionStorage.setItem("partneron.user", JSON.stringify(result.user));
        window.location.href = "/dashboard";
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
        window.location.href = "/dashboard";
      }
    } catch (caught) {
      setOtpError(caught instanceof Error ? caught.message : "2차 인증 검증에 실패했습니다.");
    } finally {
      setOtpLoading(false);
    }
  }

  // Password Reset Flow Step 1: Request OTP
  async function handleRequestResetOTP(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      const resDetail = await requestPasswordReset(resetEmail);
      setResetMessage(resDetail);
      setResetStep(2);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "비밀번호 재설정 요청에 실패했습니다.");
    } finally {
      setResetLoading(false);
    }
  }

  // Password Reset Flow Step 2: Confirm & Update Password
  async function handleConfirmReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      const resDetail = await confirmPasswordReset(resetEmail, resetOtpCode, newPassword);
      setResetMessage(resDetail);
      setTimeout(() => {
        setShowResetModal(false);
        setResetStep(1);
        setResetEmail("");
        setResetOtpCode("");
        setNewPassword("");
        setResetMessage("");
      }, 2000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "비밀번호 변경 처리에 실패했습니다.");
    } finally {
      setResetLoading(false);
    }
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

            {/* Alert Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-[#E01E35] text-center">
                {error}
              </div>
            )}

            {/* Action Buttons Section */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>

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
                    setResetStep(1);
                    setResetError("");
                    setResetMessage("");
                  }}
                  className="hover:text-[#01916D] transition-colors cursor-pointer"
                >
                  비밀번호 찾기
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Password Reset Modal Flow */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#333333]">비밀번호 재설정</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕ 닫기
              </button>
            </div>

            {resetError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-[#E01E35] text-center">
                {resetError}
              </div>
            )}

            {resetMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#01916D] text-center">
                {resetMessage}
              </div>
            )}

            {resetStep === 1 && (
              <form onSubmit={handleRequestResetOTP} className="space-y-4 text-xs sm:text-sm">
                <p className="text-xs text-slate-500 leading-relaxed">
                  가입 시 사용한 이메일 주소를 입력하시면 비밀번호 재설정용 6자리 인증번호를 발송해 드립니다.
                </p>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">이메일 주소</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@partneron.co.kr"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 text-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail.trim()}
                    className="px-5 py-3 bg-[#01916D] hover:bg-[#006449] disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    {resetLoading ? "발송 중..." : "인증번호 발송"}
                  </button>
                </div>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleConfirmReset} className="space-y-4 text-xs sm:text-sm">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>{resetEmail}</strong> 이메일로 전송된 6자리 인증번호와 새로 변경할 비밀번호를 입력해 주세요.
                </p>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">인증번호 (6자리 OTP)</label>
                  <input
                    type="text"
                    value={resetOtpCode}
                    onChange={(e) => setResetOtpCode(e.target.value)}
                    placeholder="예: 482910"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-center font-mono text-base font-bold focus:bg-white focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">새 비밀번호 (8자 이상)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 text-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-between items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    ‹ 이전 단계
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading || !resetOtpCode.trim() || newPassword.length < 8}
                      className="px-5 py-3 bg-[#01916D] hover:bg-[#006449] disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer"
                    >
                      {resetLoading ? "변경 중..." : "비밀번호 변경"}
                    </button>
                  </div>
                </div>
              </form>
            )}
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
