import { getOrCreateDeviceId, getDeviceName } from "./device";

export type LoginRequest = {
  email: string;
  password: string;
  device_uuid?: string;
  device_name?: string;
};

export type LoginResponse = {
  access?: string;
  refresh?: string;
  require_2fa?: boolean;
  pre_token?: string;
  email?: string;
  is_totp_configured?: boolean;
  user?: {
    id: number;
    email: string;
    name: string;
    role: "OWNER" | "MANAGER" | "EMPLOYEE";
    is_2fa_enabled?: boolean;
    requires_2fa?: boolean;
    workplace: {
      id: number;
      name: string;
      enforce_2fa_owner?: boolean;
      enforce_2fa_manager?: boolean;
      enforce_2fa_employee?: boolean;
    } | null;
  };
};

export type SignUpRequest = {
  name: string;
  email: string;
  password: string;
  workplace_name: string;
};

export type MemberDto = {
  id: number;
  email: string;
  name: string;
  role: "OWNER" | "MANAGER" | "EMPLOYEE";
  is_2fa_enabled?: boolean;
  requires_2fa?: boolean;
  workplace: {
    id: number;
    name: string;
    enforce_2fa_owner?: boolean;
    enforce_2fa_manager?: boolean;
    enforce_2fa_employee?: boolean;
  } | null;
};

export type DeviceDto = {
  id: number;
  device_uuid: string;
  device_name: string;
  ip_address: string | null;
  user_agent: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requested_at: string;
  approved_at: string | null;
  user_email: string;
  user_name: string;
  user_role: string;
};

export type CreateMemberRequest = {
  name: string;
  email: string;
  password: string;
  role: "MANAGER" | "EMPLOYEE";
};

export type UpdateMemberRequest = {
  name?: string;
  email?: string;
  role?: "MANAGER" | "EMPLOYEE";
  password?: string;
};

export type TwoFAPolicyDto = {
  enforce_2fa_owner: boolean;
  enforce_2fa_manager: boolean;
  enforce_2fa_employee: boolean;
};

// Dynamic API Base URL resolution for both localhost & IP access
function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const payload = {
    ...request,
    device_uuid: request.device_uuid || getOrCreateDeviceId(),
    device_name: request.device_name || getDeviceName(),
  };

  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await readJsonResponse(response);
  if (!response.ok) throw new Error(body?.detail ?? "이메일 또는 비밀번호를 확인해 주세요.");
  return body as LoginResponse;
}

export async function verify2FA(email: string, otpCode: string): Promise<LoginResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/verify-2fa/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code: otpCode }),
  });
  const body = await readJsonResponse(response);
  if (!response.ok) throw new Error(body?.detail ?? "2차 인증 번호가 올바르지 않습니다.");
  return body as LoginResponse;
}

export async function setupTOTP(token: string): Promise<{ secret: string; otpauth_url: string; qr_code_url?: string; is_enabled: boolean }> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/2fa/setup-totp/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await readJsonResponse(response);
  if (!response.ok) throw new Error(parseErrorMessage(body, "TOTP 정보를 불러오지 못했습니다."));
  return body as { secret: string; otpauth_url: string; qr_code_url?: string; is_enabled: boolean };
}

export async function verifySetupTOTP(token: string, otpCode: string): Promise<{ detail: string; backup_codes: string[] }> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/2fa/setup-totp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp_code: otpCode }),
  });
  const body = await readJsonResponse(response);
  if (!response.ok) throw new Error(parseErrorMessage(body, "TOTP 핀 코드 검증에 실패했습니다."));
  return body as { detail: string; backup_codes: string[] };
}

export async function toggle2FA(token: string, enable?: boolean): Promise<{ is_2fa_enabled: boolean; backup_codes: string[]; detail: string }> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/2fa/toggle/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ enable }),
  });
  const body = await readJsonResponse(response);
  if (!response.ok) throw new Error(parseErrorMessage(body, "2FA 설정 변경 실패"));
  return body as { is_2fa_enabled: boolean; backup_codes: string[]; detail: string };
}

export async function get2FAPolicy(token: string): Promise<TwoFAPolicyDto> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/2fa-policy/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await readJsonResponse(response);
  if (!response.ok) throw new Error(parseErrorMessage(body, "2FA 정책을 불러오지 못했습니다."));
  return body as TwoFAPolicyDto;
}

export async function update2FAPolicy(token: string, policy: Partial<TwoFAPolicyDto>): Promise<TwoFAPolicyDto & { detail: string }> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/2fa-policy/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(policy),
  });
  const body = await readJsonResponse(response);
  if (!response.ok) throw new Error(parseErrorMessage(body, "2FA 정책 수정 실패"));
  return body as TwoFAPolicyDto & { detail: string };
}

export async function signUp(request: SignUpRequest): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/signup/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (response.ok) return;
  const body = await readJsonResponse(response);
  throw new Error(
    body?.email?.[0] ??
      body?.workplace_name?.[0] ??
      body?.password?.[0] ??
      body?.detail ??
      `회원가입에 실패했습니다. (HTTP ${response.status})`,
  );
}

// My Profile Functions
export async function getMyProfile(token: string): Promise<{ user: MemberDto; my_devices: DeviceDto[]; is_2fa_enabled: boolean; requires_2fa: boolean; has_totp: boolean; backup_codes_count: number }> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/profile/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(parseErrorMessage(body, "내 프로필 정보를 불러오지 못했습니다."));
  }
  return body as any;
}

export async function updateMyProfile(
  token: string,
  payload: { name?: string; password?: string }
): Promise<{ detail: string; user: MemberDto }> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/profile/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(parseErrorMessage(body, "프로필 수정에 실패했습니다."));
  }
  return body as { detail: string; user: MemberDto };
}

export async function getMembers(token: string): Promise<MemberDto[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/members/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(parseErrorMessage(body, "구성원 목록을 불러오지 못했습니다."));
  }
  return body?.members as MemberDto[];
}

export async function createMember(
  token: string,
  request: CreateMemberRequest,
): Promise<MemberDto> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/members/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      body?.email?.[0] ??
        body?.non_field_errors?.[0] ??
        parseErrorMessage(body, "구성원 생성에 실패했습니다."),
    );
  }
  return body?.member as MemberDto;
}

export async function updateMember(
  token: string,
  memberId: number,
  request: UpdateMemberRequest,
): Promise<MemberDto> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/members/${memberId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      body?.email?.[0] ??
        body?.non_field_errors?.[0] ??
        parseErrorMessage(body, "구성원 수정에 실패했습니다."),
    );
  }
  return body?.member as MemberDto;
}

export async function deleteMember(token: string, memberId: number): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/members/${memberId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.ok) return;
  const body = await readJsonResponse(response);
  throw new Error(parseErrorMessage(body, "구성원 삭제에 실패했습니다."));
}

// Device Management Functions
export async function getDevices(token: string): Promise<DeviceDto[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/devices/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(parseErrorMessage(body, "기기 목록을 불러오지 못했습니다."));
  }
  return body?.devices as DeviceDto[];
}

export async function approveDevice(token: string, deviceId: number): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/devices/${deviceId}/approve/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(parseErrorMessage(body, "기기 승인 처리에 실패했습니다."));
  }
  return body?.detail ?? "기기가 승인되었습니다.";
}

export async function rejectDevice(token: string, deviceId: number): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/workplace/devices/${deviceId}/reject/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(parseErrorMessage(body, "기기 거절 처리에 실패했습니다."));
  }
  return body?.detail ?? "기기가 거절되었습니다.";
}

function parseErrorMessage(body: Record<string, any> | null, defaultMsg: string): string {
  const detail = body?.detail ?? "";
  if (
    typeof detail === "string" &&
    (detail.includes("Given token not valid") || detail.includes("token_not_valid"))
  ) {
    return "로그인 세션이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.";
  }
  return detail || defaultMsg;
}

async function readJsonResponse(response: Response): Promise<Record<string, any> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : null;
}
