"use client";

import { FormEvent, useState } from "react";
import { signUp } from "../../lib/auth-api";

export default function SignUpPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));

    if (password !== String(form.get("passwordConfirm"))) {
      setMessage("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      await signUp({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password,
        workplace_name: String(form.get("workplaceName")),
      });
      setIsSuccess(true);
      setMessage("가입이 성공적으로 완료되었습니다. 로그인해 주시기 바랍니다.");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#333333] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#01916D]/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-12 relative z-10 border border-slate-200/50">
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="flex items-center gap-1.5 group">
            <span className="text-xl font-black tracking-tighter text-[#333333]">FUJIFILM</span>
            <span className="w-2 h-2 rounded-full bg-[#E01E35]"></span>
            <span className="text-base font-bold text-[#01916D] ml-0.5">partneron</span>
          </a>
          <span className="px-3 py-1 bg-[#01916D]/10 text-[#01916D] font-bold text-xs rounded-full">
            GET STARTED
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#333333] tracking-tight">사업장 등록</h1>
          <p className="text-sm text-[#5C5C5C] mt-1.5">
            첫 가입자는 해당 사업장의 <strong className="text-[#333333] font-semibold">대표(OWNER) 권한</strong>으로 자동 생성됩니다.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="workplaceName" className="block text-xs font-semibold text-[#333333] mb-1">
              사업장명
            </label>
            <input
              id="workplaceName"
              name="workplaceName"
              placeholder="예: Partneron 서울 본사"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-[#333333] mb-1">
                대표자 이름
              </label>
              <input
                id="name"
                name="name"
                placeholder="이름을 입력하세요"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#333333] mb-1">
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#333333] mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                placeholder="8자 이상"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label htmlFor="passwordConfirm" className="block text-xs font-semibold text-[#333333] mb-1">
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                minLength={8}
                placeholder="비밀번호 재입력"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            {loading ? "가입 처리 중..." : "대표 계정 만들기"}
          </button>

          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold ${
                isSuccess
                  ? "bg-emerald-50 text-[#01916D] border border-emerald-200"
                  : "bg-rose-50 text-[#E01E35] border border-rose-200"
              }`}
            >
              {message}
            </div>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-[#5C5C5C]">
          이미 계정이 있으신가요?{" "}
          <a href="/" className="font-bold text-[#01916D] hover:underline ml-1">
            로그인 하러 가기
          </a>
        </div>
      </div>
    </main>
  );
}
