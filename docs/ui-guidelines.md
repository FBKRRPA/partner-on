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

## ✨ 2. UI/UX 디자인 패러다임 (Rich & Premium UI)

1. **Glassmorphism**:
   * 헤더 및 모달 패널에 `backdrop-blur-md`, `bg-white/95`, `border-slate-200/80` 적용.
2. **Rounded Card Aesthetic**:
   * 모달 및 대시보드 카드 레이아웃은 `rounded-2xl` 또는 `rounded-3xl`의 부드러운 라운딩 적용.
3. **Micro-Animations**:
   * 드롭다운 및 모달 팝업 시 `animate-in fade-in slide-in-from-top-2`, 버튼 클릭 시 `transition-all duration-150` 유지.
4. **Status Badges 규격**:
   * ✅ 승인 완료 / 활성: `bg-emerald-100 text-[#01916D]`
   * ⏳ 승인 대기 / 2FA 필수: `bg-amber-100 text-amber-800`
   * ❌ 승인 거절 / 위험: `bg-rose-100 text-[#E01E35]`

---

## 🚫 3. UI 이모지 및 아이콘 사용 제한 (Text-First Design)

* ❌ **금지**: 헤더, 버튼, 카테고리 빵부스러기, 카드 타이틀 등에 임의의 유니코드 이모지(📌, 👥, 📱, 📈 등) 및 조잡한 아이콘 삽입을 금지합니다.
* ✅ **원칙**: 텍스트 중심의 차분하고 정돈된 B2B 프리미엄 UI 레이아웃을 유지하며, 시각적 강조가 필요한 경우 브랜드 컬러 뱃지(`bg-[#01916D]/10 text-[#01916D]`)와 상태 컬러 태그만 활용합니다.
