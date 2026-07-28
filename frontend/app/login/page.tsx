"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, verify2FA } from "../../lib/auth-api";
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

  return (
    <div className="min-h-screen bg-[#202020] flex flex-col justify-between font-sans">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#01916D]/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00D164]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 border border-slate-200/50 my-8">
          {/* Left Hero Branding Section */}
          <section className="lg:col-span-6 bg-gradient-to-br from-[#006449] via-[#01916D] to-[#202020] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

            <div>
              <a href="/" className="inline-flex flex-col group">
                <span className="text-[11px] font-semibold text-emerald-100/70 tracking-wider uppercase mt-0.5">
                  <img
                    src="/fujifilm-logo1.png"
                    alt="FUJIFILM Logo"
                    className="h-9 sm:h-10 w-auto object-contain brightness-0 invert"
                  />
                </span>
              </a>
            </div>

            <div className="my-12">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider text-emerald-200 uppercase mb-4 border border-white/10">
                CONNECTED WORKPLACE
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                파트너 포털
                <br />
              </h1>
              <p className="mt-4 text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
                이제 Partner On에서 복합기 장비부터 계약 정보까지 통합적으로 관리할 수 있습니다.
              </p>
            </div>

            <div className="text-xs text-emerald-100/60 font-medium">
              © {new Date().getFullYear()} FUJIFILM Business Innovation Korea Co., Ltd. All rights reserved.
            </div>
          </section>

          {/* Right Login Form Section */}
          <section className="lg:col-span-6 p-8 sm:p-12 bg-white flex flex-col justify-center relative">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-8">
                <span className="text-xs font-bold tracking-wider text-[#01916D] uppercase">
                  PARTNER ON LOGIN
                </span>
                <h2 className="text-3xl font-extrabold text-[#202020] tracking-tight mt-1">로그인</h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Partner On 계정 정보로 로그인해 주세요.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-[#202020] mb-1.5">
                    이메일 주소
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="text-xs font-semibold text-[#202020]">
                      비밀번호
                    </label>
                    <a href="#password-reset" className="text-xs font-semibold text-[#01916D] hover:underline">
                      비밀번호 찾기
                    </a>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      name="remember"
                      className="w-4 h-4 rounded border-slate-300 text-[#01916D] focus:ring-[#01916D]"
                    />
                    로그인 상태 유지
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {loading ? "로그인 처리 중..." : "로그인"}
                </button>

                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-[#E01E35]">
                    {error}
                  </div>
                )}
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
                처음 이용하시나요?{" "}
                <a href="/signup" className="font-bold text-[#01916D] hover:underline ml-1">
                  사업장 등록 및 회원가입
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 2FA Verification Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#01916D]/10 border border-[#01916D]/30 flex items-center justify-center mx-auto text-2xl">
                🔐
              </div>
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
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-center font-mono text-lg tracking-widest font-bold focus:outline-none focus:border-[#01916D] focus:ring-2 focus:ring-[#01916D]/20 text-slate-900"
                />
              </div>

              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-[#E01E35] text-center">
                  {otpError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={otpLoading || !otpCode.trim()}
                  className="flex-1 py-3.5 bg-[#01916D] hover:bg-[#006449] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {otpLoading ? "인증 확인 중..." : "2차 인증 완료"}
                </button>
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition-all cursor-pointer"
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
