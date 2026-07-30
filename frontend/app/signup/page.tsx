"use client";

import React, { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signUp, signUpWithInvite } from "../../lib/auth-api";

function SignUpFormContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"OWNER" | "MEMBER">("OWNER");

  // Owner SignUp State
  const [ownerMessage, setOwnerMessage] = useState("");
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerSuccess, setOwnerSuccess] = useState(false);

  // Member Invite SignUp State
  const [memberEmail, setMemberEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [memberMessage, setMemberMessage] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberSuccess, setMemberSuccess] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const codeParam = searchParams.get("code");
    const emailParam = searchParams.get("email");

    if (tabParam === "invite" || codeParam) {
      setTab("MEMBER");
    }
    if (codeParam) {
      setInviteCode(codeParam);
    }
    if (emailParam) {
      setMemberEmail(emailParam);
    }
  }, [searchParams]);

  async function onOwnerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOwnerLoading(true);
    setOwnerMessage("");
    setOwnerSuccess(false);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));

    if (password !== String(form.get("passwordConfirm"))) {
      setOwnerMessage("비밀번호가 일치하지 않습니다.");
      setOwnerLoading(false);
      return;
    }

    try {
      await signUp({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password,
        workplace_name: String(form.get("workplaceName")),
      });
      setOwnerSuccess(true);
      setOwnerMessage("사업장 및 대표 계정이 성공적으로 등록되었습니다. 로그인해 주시기 바랍니다.");
      event.currentTarget.reset();
    } catch (error) {
      setOwnerMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setOwnerLoading(false);
    }
  }

  async function onMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMemberLoading(true);
    setMemberMessage("");
    setMemberSuccess(false);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const passwordConfirm = String(form.get("passwordConfirm"));

    if (password !== passwordConfirm) {
      setMemberMessage("비밀번호가 일치하지 않습니다.");
      setMemberLoading(false);
      return;
    }

    try {
      const res = await signUpWithInvite({
        email: memberEmail,
        invite_code: inviteCode,
        password,
      });

      setMemberSuccess(true);
      setMemberMessage(res.detail || "성공적으로 가입되었습니다.");

      if (res.access && res.user) {
        sessionStorage.setItem("accessToken", res.access);
        sessionStorage.setItem("refreshToken", res.refresh || "");
        sessionStorage.setItem("user", JSON.stringify(res.user));
        sessionStorage.setItem("partneron.accessToken", res.access);
        sessionStorage.setItem("partneron.user", JSON.stringify(res.user));
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (error) {
      setMemberMessage(error instanceof Error ? error.message : "초대 코드 가입에 실패했습니다.");
    } finally {
      setMemberLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-12 relative z-10 border border-slate-200/50">
      <div className="flex items-center justify-between mb-6">
        <a href="/" className="flex items-center gap-1.5 group">
          <span className="text-xl font-black tracking-tighter text-[#333333]">FUJIFILM</span>
          <span className="w-2 h-2 rounded-full bg-[#E01E35]" />
          <span className="text-base font-bold text-[#01916D] ml-0.5">partneron</span>
        </a>
        <span className="px-3 py-1 bg-[#01916D]/10 text-[#01916D] font-bold text-xs rounded-full">
          GET STARTED
        </span>
      </div>

      {/* Tab Selection */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          type="button"
          onClick={() => setTab("OWNER")}
          className={`flex-1 py-3 text-center font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            tab === "OWNER"
              ? "border-[#01916D] text-[#01916D]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          사업장 신규 등록 (대표자)
        </button>
        <button
          type="button"
          onClick={() => setTab("MEMBER")}
          className={`flex-1 py-3 text-center font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            tab === "MEMBER"
              ? "border-[#01916D] text-[#01916D]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          초대코드로 가입 (구성원)
        </button>
      </div>

      {/* TAB 1: OWNER REGISTRATION */}
      {tab === "OWNER" && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#333333] tracking-tight">
              사업장 신규 등록
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1.5">
              첫 가입자는 해당 사업장의 <strong className="text-[#333333]">대표(OWNER) 권한</strong>으로 자동 등록됩니다.
            </p>
          </div>

          <form onSubmit={onOwnerSubmit} className="space-y-4">
            <div>
              <label htmlFor="workplaceName" className="block text-xs font-semibold text-[#333333] mb-1">
                사업장명
              </label>
              <input
                id="workplaceName"
                name="workplaceName"
                placeholder="예: Partneron 서울 본사"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-[#333333] mb-1">
                  대표자 성명
                </label>
                <input
                  id="name"
                  name="name"
                  placeholder="이름을 입력하세요"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              disabled={ownerLoading}
              className="w-full mt-2 py-3.5 px-4 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              {ownerLoading ? "등록 처리 중..." : "대표 계정 만들기"}
            </button>

            {ownerMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold ${
                  ownerSuccess
                    ? "bg-emerald-50 text-[#01916D] border border-emerald-200"
                    : "bg-rose-50 text-[#E01E35] border border-rose-200"
                }`}
              >
                {ownerMessage}
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: MEMBER INVITE SIGNUP */}
      {tab === "MEMBER" && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#333333] tracking-tight">
              초대코드로 회원가입
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1.5">
              대표자에게 전달받은 이메일 주소와 8자리 초대 코드를 입력하여 가입하세요.
            </p>
          </div>

          <form onSubmit={onMemberSubmit} className="space-y-4">
            <div>
              <label htmlFor="memberEmail" className="block text-xs font-semibold text-[#333333] mb-1">
                초대받은 이메일 주소
              </label>
              <input
                id="memberEmail"
                name="email"
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="user@partneron.co.kr"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="inviteCode" className="block text-xs font-semibold text-[#333333] mb-1">
                초대 코드 (8자리)
              </label>
              <input
                id="inviteCode"
                name="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="예: INV-8A9F2K"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm font-mono font-bold uppercase bg-slate-50/50 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="memberPassword" className="block text-xs font-semibold text-[#333333] mb-1">
                  사용할 비밀번호
                </label>
                <input
                  id="memberPassword"
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="8자 이상"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="memberPasswordConfirm" className="block text-xs font-semibold text-[#333333] mb-1">
                  비밀번호 확인
                </label>
                <input
                  id="memberPasswordConfirm"
                  name="passwordConfirm"
                  type="password"
                  minLength={8}
                  placeholder="비밀번호 재입력"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#01916D]/30 focus:border-[#01916D] text-sm bg-slate-50/50 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              disabled={memberLoading}
              className="w-full mt-2 py-3.5 px-4 bg-[#01916D] hover:bg-[#006449] active:bg-[#006449] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              {memberLoading ? "가입 및 검증 중..." : "초대코드로 가입 완료"}
            </button>

            {memberMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold ${
                  memberSuccess
                    ? "bg-emerald-50 text-[#01916D] border border-emerald-200"
                    : "bg-rose-50 text-[#E01E35] border border-rose-200"
                }`}
              >
                {memberMessage}
              </div>
            )}
          </form>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-[#5C5C5C]">
        이미 계정이 있으신가요?{" "}
        <a href="/login" className="font-bold text-[#01916D] hover:underline ml-1">
          로그인 하러 가기
        </a>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#333333] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#01916D]/30 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-white text-sm">로딩 중...</div>}>
        <SignUpFormContent />
      </Suspense>
    </main>
  );
}
