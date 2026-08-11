"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  approveDevice,
  deleteDevice,
  deleteMember,
  DeviceDto,
  get2FAPolicy,
  getDevices,
  getMemberBackupCodes,
  getMembers,
  inviteMember,
  MemberDto,
  regenerateMemberBackupCodes,
  reinviteMember,
  rejectDevice,
  RoleType,
  TwoFAPolicyDto,
  update2FAPolicy,
  updateMember,
  formatKoreanDateTime,
} from "../lib/auth-api";

interface Props {
  accessToken: string;
}

export function MemberManagement({ accessToken }: Props): React.ReactNode {
  const [activeTab, setActiveTab] = useState<"MEMBERS" | "DEVICES" | "POLICY">("MEMBERS");

  // Member state
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Backup codes modal state
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupCodesList, setBackupCodesList] = useState<string[]>([]);
  const [backupTargetMember, setBackupTargetMember] = useState<MemberDto | null>(null);
  const [backupModalLoading, setBackupModalLoading] = useState(false);

  // Device state
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [deviceFetching, setDeviceFetching] = useState(false);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // 2FA Policy state
  const [policy, setPolicy] = useState<TwoFAPolicyDto>({
    enforce_2fa_owner: false,
    enforce_2fa_admin_staff: false,
    enforce_2fa_sales: false,
    enforce_2fa_ce: false,
  });
  const [policyFetching, setPolicyFetching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (accessToken) {
      loadMembers();
      loadDevices();
      loadPolicy();
    }
  }, [accessToken]);

  async function loadMembers() {
    try {
      setFetching(true);
      const data = await getMembers(accessToken);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  async function loadDevices() {
    try {
      setDeviceFetching(true);
      const data = await getDevices(accessToken);
      setDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDeviceFetching(false);
    }
  }

  async function loadPolicy() {
    try {
      setPolicyFetching(true);
      const data = await get2FAPolicy(accessToken);
      setPolicy(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPolicyFetching(false);
    }
  }

  async function handleTogglePolicyField(field: keyof TwoFAPolicyDto) {
    try {
      setLoading(true);
      const updatedValue = !policy[field];
      const res = await update2FAPolicy(accessToken, { [field]: updatedValue });
      setPolicy({
        enforce_2fa_owner: !!res.enforce_2fa_owner,
        enforce_2fa_admin_staff: !!res.enforce_2fa_admin_staff,
        enforce_2fa_sales: !!res.enforce_2fa_sales,
        enforce_2fa_ce: !!res.enforce_2fa_ce,
      });
      setMessage(res.detail);
      setIsError(false);
      await loadMembers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "2FA 정책 변경 실패");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveDevice(deviceId: number) {
    try {
      setLoading(true);
      const resMsg = await approveDevice(accessToken, deviceId);
      setMessage(resMsg);
      setIsError(false);
      await loadDevices();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "승인 처리 중 오류 발생");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectDevice(deviceId: number) {
    if (!confirm("해당 기기 접속을 거절하시겠습니까?")) return;
    try {
      setLoading(true);
      const resMsg = await rejectDevice(accessToken, deviceId);
      setMessage(resMsg);
      setIsError(false);
      await loadDevices();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "거절 처리 중 오류 발생");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDevice(deviceId: number, deviceName: string) {
    if (!confirm(`정말로 [${deviceName}] 접속 기기를 목록에서 완전히 삭제하시겠습니까?`)) return;
    try {
      setLoading(true);
      const resMsg = await deleteDevice(accessToken, deviceId);
      setMessage(resMsg);
      setIsError(false);
      await loadDevices();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "기기 삭제 중 오류 발생");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenBackupCodesModal(member: MemberDto) {
    try {
      setBackupModalLoading(true);
      setBackupTargetMember(member);
      const res = await getMemberBackupCodes(accessToken, member.id);
      setBackupCodesList(res.backup_codes || []);
      setBackupModalOpen(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "백업 코드를 가져오는데 실패했습니다.");
      setIsError(true);
    } finally {
      setBackupModalLoading(false);
    }
  }

  async function handleRegenerateBackupCodes() {
    if (!backupTargetMember) return;
    if (!confirm(`'${backupTargetMember.name}' 사원의 2FA 비상 복구 백업 코드 10개를 새로 재발급하시겠습니까?\n(기존 백업 코드는 모두 무효화됩니다.)`)) return;

    try {
      setBackupModalLoading(true);
      const res = await regenerateMemberBackupCodes(accessToken, backupTargetMember.id);
      setBackupCodesList(res.backup_codes || []);
      setMessage(res.detail || "백업 코드가 새로 재발급되었습니다.");
      setIsError(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "백업 코드 재발급에 실패했습니다.");
      setIsError(true);
    } finally {
      setBackupModalLoading(false);
    }
  }

  // Invite Member Flow (No password input required)
  async function handleInviteMemberSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as RoleType;

    try {
      setLoading(true);
      const res = await inviteMember(accessToken, { name, email, role });
      setMessage(`'${name}' 구성원에게 초대 코드 [${res.invite_code}]가 생성 및 발송되었습니다.`);
      setIsError(false);
      await loadMembers();
      setIsInviteModalOpen(false);
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "구성원 초대 발송에 실패했습니다.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditMemberSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as RoleType;
    const password = formData.get("password") as string;

    const payload: { name?: string; email?: string; role?: RoleType; password?: string } = {};
    if (name) payload.name = name;
    if (email) payload.email = email;
    if (role) payload.role = role;
    if (password) payload.password = password;

    try {
      setLoading(true);
      await updateMember(accessToken, selectedMember.id, payload);
      setMessage(`'${selectedMember.name}' 정보가 업데이트되었습니다.`);
      setIsError(false);
      await loadMembers();
      setIsEditMode(false);
      setIsDetailModalOpen(false);
      setSelectedMember(null);
      setTimeout(() => {
        setMessage("");
      }, 1500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "구성원 수정에 실패했습니다.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(member: MemberDto) {
    if (member.role === "OWNER") {
      alert("관리자(대표) 계정은 삭제할 수 없습니다.");
      return;
    }
    if (!confirm(`정말로 '${member.name}' 구성원을 삭제하시겠습니까?`)) return;

    try {
      setLoading(true);
      await deleteMember(accessToken, member.id);
      setMessage(`'${member.name}' 구성원이 삭제되었습니다.`);
      setIsError(false);
      await loadMembers();
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleReinvite(member: MemberDto) {
    if (!confirm(`'${member.name}' 구성원에게 새로운 24시간 초대 코드를 재발송하시겠습니까?`)) return;
    try {
      setLoading(true);
      const res = await reinviteMember(accessToken, member.id);
      setMessage(`'${member.name}' 구성원에게 초대 코드 [${res.invite_code}]가 성공적으로 재발송되었습니다. (24시간 유효)`);
      setIsError(false);
      await loadMembers();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "초대 재발송에 실패했습니다.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyInviteCode(code: string) {
    navigator.clipboard.writeText(code);
    alert(`초대 코드 [${code}]가 클립보드에 복사되었습니다.\n사원에게 메신저나 이메일로 전해 주시면 가입이 가능합니다.`);
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700">관리자(대표)</span>;
      case "ADMIN_STAFF":
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700">관리자(사무직원)</span>;
      case "SALES":
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700">영업</span>;
      case "CE":
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-[#01916D]">CE</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  const pendingDevices = devices.filter((d) => d.status === "PENDING");

  const filteredDevices = devices.filter((d) => {
    const matchesStatus = deviceStatusFilter === "ALL" || d.status === deviceStatusFilter;
    const query = deviceSearchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      d.user_name.toLowerCase().includes(query) ||
      d.user_email.toLowerCase().includes(query) ||
      d.device_name.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Tab Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => {
            setActiveTab("MEMBERS");
            setMessage("");
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "MEMBERS"
              ? "bg-[#01916D] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          구성원 목록 ({members.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("DEVICES");
            setMessage("");
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 relative cursor-pointer ${
            activeTab === "DEVICES"
              ? "bg-[#01916D] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          기기 승인 관리 ({devices.length})
          {pendingDevices.length > 0 && (
            <span className="bg-[#E01E35] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
              {pendingDevices.length} 대기
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("POLICY");
            setMessage("");
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "POLICY"
              ? "bg-[#01916D] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          2FA 역할별 강제 정책
        </button>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold border ${
            isError
              ? "bg-rose-50 border-rose-200 text-[#E01E35]"
              : "bg-emerald-50 border-emerald-200 text-[#01916D]"
          }`}
        >
          {message}
        </div>
      )}

      {/* TAB 1: 구성원 관리 */}
      {activeTab === "MEMBERS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#333333]">소속 구성원 목록</h3>
            <button
              onClick={() => {
                setIsInviteModalOpen(true);
                setMessage("");
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-[#01916D] hover:bg-[#006449] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              + 새 구성원 초대 (초대코드 발송)
            </button>
          </div>

          {fetching ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              구성원 정보를 불러오는 중...
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              등록된 구성원이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">이름</th>
                    <th className="py-3.5 px-4">이메일</th>
                    <th className="py-3.5 px-4">직급 (Role)</th>
                    <th className="py-3.5 px-4">초대 코드</th>
                    <th className="py-3.5 px-4">가입 상태</th>
                    <th className="py-3.5 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setIsEditMode(false);
                        setIsDetailModalOpen(true);
                        setMessage("");
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-[#333333]">{m.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{m.email}</td>
                      <td className="py-3.5 px-4">{getRoleBadge(m.role)}</td>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {m.invite_code ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                            <span>{m.invite_code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyInviteCode(m.invite_code!)}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                            >
                              복사
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            m.is_invite_accepted
                              ? "bg-emerald-100 text-[#01916D]"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {m.is_invite_accepted ? "가입 완료" : "초대 대기"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        {!m.is_invite_accepted && (
                          <button
                            onClick={() => handleReinvite(m)}
                            disabled={loading}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            초대 재발송
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenBackupCodesModal(m)}
                          disabled={backupModalLoading}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#01916D] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          title="관리자 비상 복구 백업코드 10개 조회"
                        >
                          🔑 백업코드
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setIsEditMode(true);
                            setIsDetailModalOpen(true);
                            setMessage("");
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          수정
                        </button>
                        {m.role !== "OWNER" && (
                          <button
                            onClick={() => handleDelete(m)}
                            disabled={loading}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-[#E01E35] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* OVERLAY POPUP MODAL: MEMBER DETAIL & EDIT */}
          {isDetailModalOpen && selectedMember && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-150">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#01916D]/10 text-[#01916D]">
                      구성원 상세 & 보안 관리
                    </span>
                    <h3 className="text-xl font-black text-[#333333]">
                      {selectedMember.name} <span className="text-xs font-normal text-slate-500">({selectedMember.email})</span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setIsEditMode(false);
                      setSelectedMember(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body: Dual Mode (View Mode vs. Edit Mode) */}
                {!isEditMode ? (
                  /* VIEW MODE */
                  <div className="space-y-5 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">성명</span>
                        <strong className="text-slate-900 font-bold">{selectedMember.name}</strong>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">이메일 주소</span>
                        <span className="font-mono text-slate-800 text-xs font-semibold">{selectedMember.email}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">직급 (Role)</span>
                        <div>{getRoleBadge(selectedMember.role)}</div>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">가입 상태</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            selectedMember.is_invite_accepted
                              ? "bg-emerald-100 text-[#01916D]"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {selectedMember.is_invite_accepted ? "가입 완료" : "초대 대기 (24h)"}
                        </span>
                      </div>
                    </div>

                    {selectedMember.invite_code && (
                      <div className="flex items-center justify-between bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                        <div>
                          <span className="text-xs font-bold text-[#01916D] block">8자리 회원가입 초대 코드</span>
                          <span className="font-mono text-sm font-black text-slate-900">{selectedMember.invite_code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyInviteCode(selectedMember.invite_code!)}
                          className="px-3 py-1 text-xs font-bold bg-[#01916D] hover:bg-[#006449] text-white rounded-lg transition-all cursor-pointer shadow-xs"
                        >
                          초대코드 복사
                        </button>
                      </div>
                    )}

                    {/* Modal Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {selectedMember.role !== "OWNER" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(selectedMember)}
                            disabled={loading}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-[#E01E35] text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            구성원 삭제
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenBackupCodesModal(selectedMember)}
                          disabled={backupModalLoading}
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#01916D] text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          🔑 비상 복구 백업코드 10개
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditMode(true)}
                          className="px-4 py-2 bg-[#01916D] hover:bg-[#006449] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          수정하기 (수정 모드)
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE FORM */
                  <form onSubmit={handleEditMemberSubmit} className="space-y-4 text-xs sm:text-sm">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 font-semibold mb-2">
                      [수정 모드] 성명, 이메일, 직급 및 새 비밀번호를 변경한 후 하단의 저장 버튼을 누르세요.
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">성명</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={selectedMember.name}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D] font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">이메일 주소</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={selectedMember.email}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">직급 (Role)</label>
                      <select
                        name="role"
                        defaultValue={selectedMember.role}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D] font-bold"
                      >
                        <option value="OWNER">관리자(대표)</option>
                        <option value="ADMIN_STAFF">관리자(사무직원)</option>
                        <option value="SALES">영업</option>
                        <option value="CE">CE (엔지니어)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        새 비밀번호 <span className="text-slate-400 font-normal">(변경시에만 입력)</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="비밀번호 변경 시 8자 이상 입력"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D]"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
                      >
                        수정 취소
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-[#01916D] hover:bg-[#006449] text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs text-xs"
                      >
                        {loading ? "저장 중..." : "수정 내용 저장하기"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* OVERLAY POPUP MODAL: CREATE / INVITE MEMBER */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-[#333333]">새 구성원 초대 (초대코드 발송)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      성명, 이메일, 직급을 지정하시면 8자리 가입 초대코드가 생성 및 발송됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleInviteMemberSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">성명</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="홍길동"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">이메일 주소</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="user@partneron.co.kr"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">직급 (Role)</label>
                    <select
                      name="role"
                      defaultValue="CE"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D] font-semibold"
                    >
                      <option value="ADMIN_STAFF">관리자(사무직원)</option>
                      <option value="SALES">영업</option>
                      <option value="CE">CE (엔지니어)</option>
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-[#01916D] hover:bg-[#006449] text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs text-xs"
                    >
                      {loading ? "발송 중..." : "초대코드 발송"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 기기 승인 관리 */}
      {activeTab === "DEVICES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#333333]">접속 승인 기기 모듈</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                사원 및 외부 접속 기기(브라우저)의 승인 대기 상태를 검토, 허용 및 관리합니다.
              </p>
            </div>

            {/* Filter Toolbar: User Search & Status Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="사용자명, 이메일, 기기 검색..."
                  value={deviceSearchQuery}
                  onChange={(e) => setDeviceSearchQuery(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D] w-48 sm:w-64"
                />
              </div>

              <select
                value={deviceStatusFilter}
                onChange={(e) => setDeviceStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#01916D] cursor-pointer"
              >
                <option value="ALL">전체 상태 ({devices.length})</option>
                <option value="PENDING">승인 대기 ({pendingDevices.length})</option>
                <option value="APPROVED">승인 완료</option>
                <option value="REJECTED">승인 거절</option>
              </select>
            </div>
          </div>

          {deviceFetching ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              기기 목록을 불러오는 중...
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              {deviceSearchQuery || deviceStatusFilter !== "ALL"
                ? "검색 조건에 해당되는 기기 내역이 없습니다."
                : "등록된 기기가 없습니다."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">사용자</th>
                    <th className="py-3.5 px-4">기기 이름</th>
                    <th className="py-3.5 px-4">상태</th>
                    <th className="py-3.5 px-4">요청 일시</th>
                    <th className="py-3.5 px-4 text-right">관리 / 승인 조작</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDevices.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#333333]">{d.user_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{d.user_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {d.device_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            d.status === "APPROVED"
                              ? "bg-emerald-100 text-[#01916D]"
                              : d.status === "PENDING"
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : "bg-rose-100 text-[#E01E35]"
                          }`}
                        >
                          {d.status === "APPROVED"
                            ? "승인됨"
                            : d.status === "PENDING"
                            ? "승인 대기"
                            : "거절됨"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {formatKoreanDateTime(d.requested_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {d.status !== "APPROVED" && (
                          <button
                            onClick={() => handleApproveDevice(d.id)}
                            disabled={loading}
                            className="px-3 py-1 bg-[#01916D] hover:bg-[#006449] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            승인하기
                          </button>
                        )}
                        {d.status !== "REJECTED" && (
                          <button
                            onClick={() => handleRejectDevice(d.id)}
                            disabled={loading}
                            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-[#E01E35] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            거절
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDevice(d.id, d.device_name)}
                          disabled={loading}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 2FA 역할별 강제 정책 관리 */}
      {activeTab === "POLICY" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-bold text-[#333333]">사업장 2FA 역할별 필수 정책 설정</h3>
            <p className="text-xs text-slate-500 mt-1">
              특정 직급(관리자 대표, 관리자 사무직원, 영업, CE)에 대해 2차 인증(2FA) 사용을 강제하도록 지정할 수 있습니다.
            </p>
          </div>

          {policyFetching ? (
            <div className="py-8 text-center text-slate-400 text-sm">보안 정책을 불러오는 중...</div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
              {/* OWNER Enforcement */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">관리자(대표) 2FA 필수화</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    대표 계정 로그인 시 2FA 2차 검증을 의무 적용합니다.
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePolicyField("enforce_2fa_owner")}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    policy.enforce_2fa_owner ? "bg-[#01916D]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      policy.enforce_2fa_owner ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* ADMIN_STAFF Enforcement */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">관리자(사무직원) 2FA 필수화</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    관리자 사무직원 계정 로그인 시 2FA 2차 검증을 의무 적용합니다.
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePolicyField("enforce_2fa_admin_staff")}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    policy.enforce_2fa_admin_staff ? "bg-[#01916D]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      policy.enforce_2fa_admin_staff ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* SALES Enforcement */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">영업 (SALES) 2FA 필수화</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    영업 담당 계정 로그인 시 2FA 2차 검증을 의무 적용합니다.
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePolicyField("enforce_2fa_sales")}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    policy.enforce_2fa_sales ? "bg-[#01916D]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      policy.enforce_2fa_sales ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* CE Enforcement */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">CE (엔지니어) 2FA 필수화</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    CE 엔지니어 계정 로그인 시 2FA 2차 검증을 의무 적용합니다.
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePolicyField("enforce_2fa_ce")}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    policy.enforce_2fa_ce ? "bg-[#01916D]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      policy.enforce_2fa_ce ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BACKUP CODES ADMIN MODAL */}
      {backupModalOpen && backupTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-[#01916D]/10 text-[#01916D] text-xs font-bold">
                  관리자 비상 지원
                </span>
                <h3 className="text-xl font-extrabold text-[#333333] mt-1">
                  [{backupTargetMember.name}] 사원 2FA 백업코드
                </h3>
                <p className="text-xs text-[#5C5C5C] mt-0.5">
                  해당 사원이 스마트폰 분실 등으로 2FA에 접속하지 못할 때 안내하는 8자리 일회성 복구 코드입니다.
                </p>
              </div>
              <button
                onClick={() => setBackupModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {backupModalLoading ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                백업 코드를 불러오는 중...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-center text-sm font-bold text-slate-800">
                  {backupCodesList.map((code, idx) => (
                    <div key={idx} className="bg-white py-2 px-3 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-xs text-slate-400 mr-2 font-sans">#{idx + 1}</span>
                      {code}
                    </div>
                  ))}
                </div>

                <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl leading-relaxed">
                  💡 <strong>관리자 안내 지침</strong>: 사원에게 복구 코드를 하나씩 전달해 주세요. 각 백업 코드는 1회 로그인 성공 시 자동 소멸됩니다.
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleRegenerateBackupCodes}
                    disabled={backupModalLoading}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#E01E35] font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    🔄 10개 전체 새 재발급
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodesList.join("\n"));
                      alert("10개의 백업 코드가 클립보드에 복사되었습니다.");
                    }}
                    className="px-5 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    📋 전체 복사하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
