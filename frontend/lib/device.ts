export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server-device-id";
  
  let deviceId = localStorage.getItem("partneron.device_uuid");
  if (!deviceId) {
    // Generate UUID v4 format
    deviceId = "device-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now().toString(36);
    localStorage.setItem("partneron.device_uuid", deviceId);
  }
  return deviceId;
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return "Unknown Device";
  const userAgent = navigator.userAgent;
  let os = "Desktop";
  if (userAgent.includes("Win")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "Macintosh";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android Mobile";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS Mobile";

  let browser = "Browser";
  if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";

  return `${os} ${browser}`;
}
