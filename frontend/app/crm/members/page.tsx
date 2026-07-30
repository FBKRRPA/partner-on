import { MenuScaffoldPage } from "../../../components/layout/MenuScaffoldPage";

export default function CrmMembersPage() {
  return (
    <MenuScaffoldPage
      category="CRM"
      title="구성원관리"
      description="소속 사업장의 사원 계정 추가, 직급 관리, 2FA 보안 정책 및 승인 기기 통제를 관리합니다."
      icon="👥"
    />
  );
}
