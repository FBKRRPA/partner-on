import { MenuScaffoldPage } from "../../../../components/layout/MenuScaffoldPage";

export default function ContractsUncontractedPage() {
  return (
    <MenuScaffoldPage
      category="계약"
      title="계약 등록"
      description="설치되었으나 정식 계약이 등록되지 않은 미계약 렌탈/임대 장비를 모니터링합니다."
      icon="⚠️"
    />
  );
}
