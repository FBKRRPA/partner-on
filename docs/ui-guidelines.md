# 🎨 PartnerOn v1.0 UI & Design Guidelines

PartnerOn 프론트엔드의 브랜드 정체성 및 Rich & Premium UI 디자인 가이드라인입니다.

---

## 🎨 1. Fujifilm 브랜드 컬러 토큰 (Color Tokens)

* **메인 브랜드 컬러**: `#01916D` (Fujifilm Emerald Green) ➔ `bg-[#01916D]`, `text-[#01916D]`
* **서브/호버 컬러**: `#006449` (Deep Emerald), `#01916D`/10 (투명 10% 탭 배경)
* **경고/에러 컬러**: `#E01E35` (Accent Red) ➔ `bg-[#E01E35]`, `text-[#E01E35]`
* **기본 배경 & 헤딩**: `#FAFAFA` (기본 배경), `#333333` (주요 헤딩), `#5C5C5C` (보조 텍스트)
* **브랜드 그라데이션**: 헤더 상단 `fujifilm-gradation-bg` (`linear-gradient(90deg, #01916D, #80C342)`)

---

## ✨ 2. UI/UX 디자인 패러다임 & 단일 전사 표준 (Standard B2B UI Guidelines)

1. **단일 표준 모델 (Authoritative Reference UI)**:
   * 전사 시스템의 모든 뷰페이지(CRM, 기초정보, 자산/수집, 계약, 모니터링 등)는 **`기초정보 관리 > 계약 관리` (`/operations/basic/contracts`)** 페이지의 디자인 구조를 **100% 절대적 단일 표준**으로 삼습니다.
2. **Glassmorphism & Canvas Background**:
   * 헤더 및 팝업 모달에 `backdrop-blur-sm`, `bg-white/95`, `border-slate-200/80` 적용.
   * 메인 캔버스 바탕은 눈의 피로를 낮추는 깨끗한 `bg-[#FAFAFA]` 준수.
3. **Rounded Card Aesthetic & B2B Data Grid Table**:
   * 모달 및 대시보드 카드, 데이터 표 래퍼는 `rounded-2xl` 또는 `rounded-3xl`의 부드럽고 정돈된 라운딩 적용.
   * 데이터 표 셀 패딩은 `p-4` 세팅 준수.
4. **Clean Glass Overlay Modal Standard**:
   * 모달 팝업은 `bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200` 및 상단 우측 원형 닫기(✕) 버튼(`w-8 h-8 rounded-full bg-slate-100`)을 전수 적용.
5. **Micro-Animations**:
   * 드롭다운 및 모달 팝업 시 `animate-in fade-in slide-in-from-top-2`, 버튼 클릭 시 `transition-all duration-150` 유지.
6. **Status Badges 규격**:
   * ✅ 승인 완료 / 활성: `bg-emerald-100 text-[#01916D]`
   * ⏳ 승인 대기 / 2FA 필수: `bg-amber-100 text-amber-800`
   * ❌ 승인 거절 / 위험: `bg-rose-100 text-[#E01E35]`

---

## 🚫 3. UI 이모지 및 아이콘 사용 제한 (Text-First Design)

* ❌ **금지**: 헤더, 버튼, 카테고리 빵부스러기, 카드 타이틀 등에 임의의 유니코드 이모지(📌, 👥, 📱, 📈 등) 및 조잡한 아이콘 삽입을 금지합니다.
* ✅ **원칙**: 텍스트 중심의 차분하고 정돈된 B2B 프리미엄 UI 레이아웃을 유지하며, 시각적 강조가 필요한 경우 브랜드 컬러 뱃지(`bg-[#01916D]/10 text-[#01916D]`)와 상태 컬러 태그만 활용합니다.

