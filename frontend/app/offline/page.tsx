import React from "react";
import Link from "next/link";
import { HeaderLogo } from "../../components/layout/HeaderLogo";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80 space-y-6">
        <div className="flex justify-center">
          <HeaderLogo />
        </div>

        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold border border-amber-200">
          ⚡
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            인터넷 연결이 필요합니다
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-light leading-relaxed">
            현재 네트워크에 연결되어 있지 않습니다. Wi-Fi 또는 데이터 연결 상태를 확인 후 다시 시도해 주세요.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-block w-full py-3.5 bg-[#01916D] hover:bg-[#006449] text-white text-sm font-bold rounded-xl shadow-md transition-all"
          >
            다시 시도하기
          </Link>
        </div>
      </div>
    </div>
  );
}
