import { MenuScaffoldPage } from "../../../../components/layout/MenuScaffoldPage";

export default function ContractsListPage() {
  return (
    <MenuScaffoldPage
      category="운영관리 · 계약"
      title="계약 목록"
      description="진행 중인 고객사 임대 계약, 만료 예정 계약 및 재계약 내역을 관리합니다."
      icon="📋"
    />
  );
}
