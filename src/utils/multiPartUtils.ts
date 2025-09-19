export function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    // JSON 배열 문자열이면 파싱
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {} // 무시하고 아래로
    }
    // 콤마 구분 문자열 대응
    if (s.includes(","))
      return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    // 단일 문자열
    return [s];
  }
  return [];
}
