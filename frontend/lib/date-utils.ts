/**
 * Korean DateTime Formatter Utilities
 * Formats dates into official Korean locale strings (ko-KR)
 */

export function formatKoreanDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput || dateInput === "-") return "-";
  
  // If already formatted in Korean format, return as is
  if (typeof dateInput === "string" && dateInput.includes("년")) {
    return dateInput;
  }

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatKoreanDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput || dateInput === "-") return "-";

  if (typeof dateInput === "string" && dateInput.includes("년")) {
    return dateInput;
  }

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
