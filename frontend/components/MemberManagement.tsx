"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  approveDevice,
  createMember,
  deleteMember,
  DeviceDto,
  get2FAPolicy,
  getDevices,
  getMembers,
  MemberDto,
  rejectDevice,
  TwoFAPolicyDto,
  update2FAPolicy,
  updateMember,
} from "../lib/auth-api";

interface Props {
  accessToken: string;
}

export function MemberManagement({ accessToken }: Props) {
  const [activeTab, setActiveTab] = useState<"MEMBERS" | "DEVICES" | "POLICY">("MEMBERS");

  // Member state
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "CREATE" | "EDIT">("LIST");
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null);

  // Device state
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [deviceFetching, setDeviceFetching] = useState(false);

  // 2FA Policy state
  const [policy, setPolicy] = useState<TwoFAPolicyDto>({
    enforce_2fa_owner: false,
    enforce_2fa_manager: false,
    enforce_2fa_employee: false,
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
        enforce_2fa_owner: res.enforce_2fa_owner,
        enforce_2fa_manager: res.enforce_2fa_manager,
        enforce_2fa_employee: res.enforce_2fa_employee,
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

  async function onCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setMessage("");
    setIsError(false);

    const form = new FormData(formElement);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const role = form.get("role") as "MANAGER" | "EMPLOYEE";

    try {
      await createMember(accessToken, { name, email, password, role });
      setMessage(`'${name}' 구성원 계정이 등록되었습니다.`);
      formElement.reset();
      await loadMembers();
      setTimeout(() => {
        setViewMode("LIST");
        setMessage("");
      }, 1500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "구성원 등록에 실패했습니다.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function onEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMember) return;

    setLoading(true);
    setMessage("");
    setIsError(false);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const role = form.get("role") as "MANAGER" | "EMPLOYEE";
    const password = String(form.get("password"));

    const payload: { name?: string; email?: string; role?: "MANAGER" | "EMPLOYEE"; password?: string } = {};
    if (name !== selectedMember.name) payload.name = name;
    if (email !== selectedMember.email) payload.email = email;
    if (role !== selectedMember.role) payload.role = role;
    if (password.trim() !== "") payload.password = password;

    try {
      await updateMember(accessToken, selectedMember.id, payload);
      setMessage(`'${name}' 구성원 정보가 수정되었습니다.`);
      await loadMembers();
      setTimeout(() => {
        setViewMode("LIST");
        setSelectedMember(null);
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
      alert("대표 계정은 삭제할 수 없습니다.");
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

  const pendingDevices = devices.filter((d) => d.status === "PENDING");

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
          👥 구성원 목록 ({members.length})
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
          📱 기기 승인 관리 ({devices.length})
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
          🛡️ 2FA 역할별 강제 정책
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
        <>
          {viewMode === "LIST" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5C5C5C] uppercase tracking-wider">
                  사업장 구성원 목록
                </span>
                <button
                  onClick={() => {
                    setViewMode("CREATE");
                    setMessage("");
                  }}
                  className="px-4 py-2 bg-[#01916D] hover:bg-[#006449] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                >
                  + 새 구성원 추가
                </button>
              </div>

              {fetching ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  구성원 목록을 불러오는 중...
                </div>
              ) : members.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  등록된 구성원이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">이름</th>
                        <th className="py-3.5 px-4">이메일</th>
                        <th className="py-3.5 px-4">직책 권한</th>
                        <th className="py-3.5 px-4">2FA 상태</th>
                        <th className="py-3.5 px-4 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#333333]">{m.name}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{m.email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                m.role === "OWNER"
                                  ? "bg-emerald-100 text-[#01916D]"
                                  : m.role === "MANAGER"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {m.role === "OWNER" ? "대표" : m.role === "MANAGER" ? "매니저" : "사원"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                m.requires_2fa
                                  ? "bg-emerald-100 text-[#01916D]"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {m.requires_2fa ? "🔒 2FA 적용 중" : "🔓 2FA 미적용"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedMember(m);
                                setViewMode("EDIT");
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
            </div>
          )}

          {/* CREATE MODE */}
          {viewMode === "CREATE" && (
            <form onSubmit={onCreateSubmit} className="space-y-4 max-w-lg">
              <h3 className="text-lg font-bold text-[#333333]">새 구성원 추가</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">이름</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="홍길동"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">이메일</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="user@company.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">초기 비밀번호</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="8자 이상 입력"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">직책 권한</label>
                <select
                  name="role"
                  defaultValue="EMPLOYEE"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] text-slate-900"
                >
                  <option value="EMPLOYEE">사원</option>
                  <option value="MANAGER">매니저</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {loading ? "등록 중..." : "구성원 등록"}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* EDIT MODE */}
          {viewMode === "EDIT" && selectedMember && (
            <form onSubmit={onEditSubmit} className="space-y-4 max-w-lg">
              <h3 className="text-lg font-bold text-[#333333]">구성원 정보 수정</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">이름</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={selectedMember.name}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">이메일</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={selectedMember.email}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  새 비밀번호 (변경 시에만 입력)
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="변경할 비밀번호 (미입력 시 기존 유구)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">직책 권한</label>
                <select
                  name="role"
                  defaultValue={selectedMember.role}
                  disabled={selectedMember.role === "OWNER"}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#01916D] text-slate-900"
                >
                  <option value="OWNER">대표 (변경 불가)</option>
                  <option value="MANAGER">매니저</option>
                  <option value="EMPLOYEE">사원</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#01916D] hover:bg-[#006449] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {loading ? "저장 중..." : "수정 완료"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("LIST");
                    setSelectedMember(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* TAB 2: 기기 승인 관리 */}
      {activeTab === "DEVICES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C5C5C] uppercase tracking-wider">
              로그인 허용 기기 관리 목록
            </span>
            <button
              onClick={loadDevices}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              🔄 새로고침
            </button>
          </div>

          {deviceFetching ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              기기 목록을 불러오는 중...
            </div>
          ) : devices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              등록된 기기가 없습니다.
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
                    <th className="py-3.5 px-4 text-right">승인 조작</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devices.map((d) => (
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
                            ? "✅ 승인됨"
                            : d.status === "PENDING"
                            ? "⏳ 승인 대기"
                            : "❌ 거절됨"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {new Date(d.requested_at).toLocaleString("ko-KR")}
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
            <h3 className="text-lg font-bold text-[#333333]">🛡️ 사업장 2FA 역할별 필수 정책 설정</h3>
            <p className="text-xs text-slate-500 mt-1">
              특정 역할(대표, 매니저, 사원)에 대해 2차 인증(2FA) 사용을 강제(Mandatory)하도록 지정할 수 있습니다.
            </p>
          </div>

          {policyFetching ? (
            <div className="py-8 text-center text-slate-400 text-sm">보안 정책을 불러오는 중...</div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
              {/* OWNER Enforcement */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">👑 대표 (OWNER) 2FA 필수화</div>
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

              {/* MANAGER Enforcement */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">👔 매니저 (MANAGER) 2FA 필수화</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    매니저 권한 계정 로그인 시 2FA 2차 검증을 의무 적용합니다.
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePolicyField("enforce_2fa_manager")}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    policy.enforce_2fa_manager ? "bg-[#01916D]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      policy.enforce_2fa_manager ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* EMPLOYEE Enforcement */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">👤 사원 (EMPLOYEE) 2FA 필수화</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    일반 사원 계정 로그인 시 2FA 2차 검증을 의무 적용합니다.
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePolicyField("enforce_2fa_employee")}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    policy.enforce_2fa_employee ? "bg-[#01916D]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      policy.enforce_2fa_employee ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
