import { ConceptStep, PaperSummary, TopicSuggestion } from "@/types";

// 계정/DB가 없는 지금 단계에서 "새로고침하면 다 날아감"만 막기 위한 가벼운 영속화.
// 사용자별/기기별 저장이 아니라 이 브라우저의 "가장 최근 세션 하나"만 기억한다.
const STORAGE_KEY = "studybridge:session:v1";

export interface PersistedSession {
  stage: string;
  grade: string;
  levelNote?: string;
  suggestions: TopicSuggestion[];
  selectedTopic: TopicSuggestion | null;
  papers: PaperSummary[];
  activePaperId: string | null;
  stepsByPaper: Record<string, ConceptStep[]>;
  stepIndexByPaper: Record<string, number>;
  completedPaperIds: string[];
  summary: string | null;
}

export function loadSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch {
    // 프라이빗 브라우징 등으로 localStorage를 못 쓰는 경우 - 그냥 처음부터 시작.
    return null;
  }
}

export function saveSession(data: PersistedSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 저장 실패해도 앱 동작에는 지장 없어야 하므로 무시.
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
