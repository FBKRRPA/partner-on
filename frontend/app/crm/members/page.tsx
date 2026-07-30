"use client";

import React, { useEffect, useState } from "react";
import { MenuScaffoldPage } from "../../../components/layout/MenuScaffoldPage";
import { MemberManagement } from "../../../components/MemberManagement";

export default function CrmMembersPage() {
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken") || sessionStorage.getItem("partneron.accessToken") || "";
    setAccessToken(token);
  }, []);

  return (
    <MenuScaffoldPage
      category="CRM"
      title="구성원관리"
      description="소속 사업장의 사원 계정 추가, 직급 관리, 2FA 보안 정책 및 승인 기기 통제를 관리합니다."
      icon="👥"
    >
      {accessToken ? (
        <MemberManagement accessToken={accessToken} />
      ) : (
        <div className="py-12 text-center text-slate-400 text-sm font-bold">
          구성원 관리 데이터를 불러오는 중...
        </div>
      )}
    </MenuScaffoldPage>
  );
}
