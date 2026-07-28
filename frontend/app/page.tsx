"use client";

import React from "react";
import { AppHeader } from "../components/layout/AppHeader";
import { AppFooter } from "../components/layout/AppFooter";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] font-sans text-slate-900 overflow-x-hidden selection:bg-[#01916D] selection:text-white flex flex-col justify-between">
      <div>
        {/* 1. 공통 헤더 컴포넌트 사용 (AppHeader) */}
        <AppHeader isLanding={true} />

        {/* 2. Hero Section (Frame 21) */}
        <section className="relative w-full h-[640px] lg:h-[760px] flex items-center overflow-hidden bg-slate-900">
          {/* Background Image Overlay with Dark Gradients */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center filter blur-[1px] scale-105"
              style={{
                backgroundImage:
                  "linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop')",
              }}
            />
            {/* Top & Bottom Dark Overlay Gradients */}
            <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
          </div>

          {/* Content Container */}
          <div className="relative z-10 max-w-[1440px] mx-auto px-6 w-full text-white">
            <div className="max-w-3xl space-y-6">
              <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black tracking-wider leading-none drop-shadow-lg font-['Paperlogy',sans-serif]">
                DX for Everyone
              </h1>

              <div className="space-y-3 pt-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white/95">
                  파트너 포털에 오신 것을 환영합니다
                </h2>
                <p className="text-lg sm:text-xl font-medium text-white/80 leading-relaxed max-w-2xl tracking-tight">
                  이제 Partner On에서 복합기 장비부터 계약 정보까지 통합적으로 관리할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FB On Customer Portal Banner */}
        <section className="max-w-[1440px] mx-auto px-6 py-12 sm:py-16 relative z-10 my-6">
          <div className="rounded-[24px] shadow-2xl min-h-[380px] sm:min-h-[490px] text-white relative overflow-hidden border border-slate-200/20">
            {/* FB On_section.jpg 이미지 */}
            <img
              src="/images/FB On_section.jpg"
              alt="FB On Section"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // 이미지 파일이 없을 경우 시각적 백업
                e.currentTarget.style.display = "none";
              }}
            />

            {/* 이미지 속 버튼 위치에 맞춘 'FB On 바로가기' 버튼 */}
            <div className="absolute left-[7%] bottom-[12%] sm:bottom-[17.4%] z-10">
              <a
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 sm:px-10 sm:py-4 rounded-full text-white bg-[#01916D] hover:bg-[#006449] font-extrabold text-base sm:text-xl tracking-tight transition-all duration-300 shadow-2xl border border-white/30 transform hover:scale-105 cursor-pointer"
              >
                FB On 바로가기
              </a>
            </div>
          </div>
        </section>

        {/* 4. 4대 서비스 스마트 카드 그리드 (2x2 Grid) */}
        <section className="max-w-[1440px] mx-auto px-6 py-12 mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#01916D] uppercase tracking-wider">
              PARTNER ON SERVICES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#333333] tracking-tight mt-1">
              비즈니스를 위한 핵심 기능
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Partner On Agent 다운로드 (Agent Download.jpg 적용) */}
            <div className="group relative bg-slate-900 rounded-[20px] border-2 border-[#01916D] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-end min-h-[380px] p-8">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500"
                style={{
                  backgroundImage:
                    "url('/images/Agent Download.jpg'), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#01916D] via-slate-950/80 to-transparent" />

              <div className="relative z-10 space-y-3">
                <span className="text-xs font-bold text-[#4DBC7A] tracking-wider uppercase">
                  AGENT PROGRAM
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Partner On Agent 다운로드
                </h3>
                <p className="text-sm sm:text-base text-white/80 font-light tracking-tight">
                  Partner On Agent 프로그램을 통해 장비 메타를 실시간으로 수집할 수 있습니다.
                </p>
                <div className="pt-2">
                  <a
                    href="https://app.partneron.co.kr/downloads/PartnerOn_Agent_Setup_1.0.0.exe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-white group-hover:text-[#96FFFD] transition-colors gap-1"
                  >
                    프로그램 다운로드 →
                  </a>
                </div>
              </div>
            </div>

            {/* Card 2: 자주 묻는 질문 ∙ 답변 (FAQ.jpg 적용) */}
            <div className="group relative bg-slate-900 rounded-[20px] border-2 border-[#01916D] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-end min-h-[380px] p-8">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500"
                style={{
                  backgroundImage:
                    "url('/images/FAQ.jpg'), url('https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1000&auto=format&fit=crop')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#01916D] via-slate-950/80 to-transparent" />

              <div className="relative z-10 space-y-3">
                <span className="text-xs font-bold text-[#4DBC7A] tracking-wider uppercase">
                  FAQ
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  자주 묻는 질문 ∙ 답변
                </h3>
                <p className="text-sm sm:text-base text-white/80 font-light tracking-tight">
                  자주 묻는 질문과 답변을 통해 궁금한 점을 빠르게 해결해 보세요.
                </p>
                <div className="pt-2">
                  <a
                    href="#faq"
                    className="inline-flex items-center text-sm font-semibold text-white group-hover:text-[#96FFFD] transition-colors gap-1"
                  >
                    FAQ 바로가기 →
                  </a>
                </div>
              </div>
            </div>

            {/* Card 3: 고객 문의 대응 (Customer Support.jpg 적용) */}
            <div className="group relative bg-slate-900 rounded-[20px] border-2 border-[#01916D] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-end min-h-[380px] p-8">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500"
                style={{
                  backgroundImage:
                    "url('/images/Customer Support.jpg'), url('https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=1000&auto=format&fit=crop')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#01916D] via-slate-950/80 to-transparent" />

              <div className="relative z-10 space-y-3">
                <span className="text-xs font-bold text-[#4DBC7A] tracking-wider uppercase">
                  CUSTOMER SUPPORT
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  고객 문의 대응
                </h3>
                <p className="text-sm sm:text-base text-white/80 font-light tracking-tight">
                  1:1 문의를 통해 신속하고 정확한 고객 지원을 제공합니다.
                </p>
                <div className="pt-2">
                  <a
                    href="#support"
                    className="inline-flex items-center text-sm font-semibold text-white group-hover:text-[#96FFFD] transition-colors gap-1"
                  >
                    1:1 문의하기 →
                  </a>
                </div>
              </div>
            </div>

            {/* Card 4: 설명서 다운로드 (User Guide.jpg 적용) */}
            <div className="group relative bg-slate-900 rounded-[20px] border-2 border-[#01916D] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-end min-h-[380px] p-8">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500"
                style={{
                  backgroundImage:
                    "url('/images/User Guide.jpg'), url('https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1000&auto=format&fit=crop')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#01916D] via-slate-950/80 to-transparent" />

              <div className="relative z-10 space-y-3">
                <span className="text-xs font-bold text-[#4DBC7A] tracking-wider uppercase">
                  USER GUIDE
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  설명서 다운로드
                </h3>
                <p className="text-sm sm:text-base text-white/80 font-light tracking-tight">
                  사용 설명서를 다운받고 자세한 내용을 확인해 보세요.
                </p>
                <div className="pt-2">
                  <a
                    href="#guide"
                    className="inline-flex items-center text-sm font-semibold text-white group-hover:text-[#96FFFD] transition-colors gap-1"
                  >
                    매뉴얼 다운로드 →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. 공통 커스텀 푸터 컴포넌트 사용 (AppFooter) */}
      <AppFooter />
    </div>
  );
}
