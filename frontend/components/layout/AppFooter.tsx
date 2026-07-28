"use client";

import React from "react";

export function AppFooter() {
  return (
    <footer className="w-full bg-[#000000] text-white flex justify-center items-center py-8 px-[20px] lg:px-[40px] lg:max-h-[285px] box-border relative font-['Noto_Sans',sans-serif] text-[14px] border-t border-slate-800/80">
      <div className="max-w-[1440px] w-full mx-auto space-y-4">
        {/* pp-footer-header: Header & Dedicated Footer Logo */}
        <div className="flex items-center gap-4">
          <img
            src="/fujifilm-logo1.png"
            alt="FUJIFILM Logo"
            className="h-8 sm:h-9 w-auto object-contain"
            style={{
              filter: "invert(1) hue-rotate(180deg)",
            }}
          />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            FUJIFILM Business Innovation
          </h2>
        </div>

        {/* pp-footer-line: Divider Line */}
        <div className="w-full h-[1px] bg-white/20 my-3" />

        {/* pp-footer-content: Footer Content Group */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            {/* pp-address */}
            <p className="text-white/80 text-xs sm:text-sm">
              서울특별시 중구 서소문로11길 19 <span className="mx-2 text-white/40">|</span>{" "}
              대표전화 <span className="text-white font-medium">1544-8988</span>
            </p>
            {/* pp-policy */}
            <p className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/90">
              <a href="/privacy-policy" className="font-bold hover:text-[#01916D] transition-colors">
                개인정보처리방침
              </a>
              <span className="text-white/40">|</span>
              <a href="/terms-of-service" className="hover:text-[#01916D] transition-colors">
                서비스이용약관
              </a>
              <span className="text-white/40">|</span>
              <a href="/copyright-policy" className="hover:text-[#01916D] transition-colors">
                저작권보호정책
              </a>
            </p>
          </div>

          {/* pp-copyright */}
          <p className="text-xs text-white/60 font-['Clarimo_UD_PE',sans-serif]">
            © FUJIFILM Business Innovation Korea Co., Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
}
