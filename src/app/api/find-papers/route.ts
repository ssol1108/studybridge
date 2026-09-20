import { NextRequest, NextResponse } from "next/server";
import { askClaude, hasClaudeKey } from "@/lib/claude";
import { PaperSummary } from "@/types";

const SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search";

// 기능 2: 주제 기반 논문 검색 + 학생 눈높이로 핵심 내용 재구성
export async function POST(req: NextRequest) {
  const { topic, grade } = await req.json();

  if (!topic || !grade) {
    return NextResponse.json({ error: "topic, grade는 필수입니다." }, { status: 400 });
  }

  const rawPapers = await searchPapers(topic);

  if (!hasClaudeKey()) {
    return NextResponse.json({ papers: mockPapers(topic) });
  }

  const system = `너는 학생이 논문을 쉽게 이해하도록 돕는 학습 코치야.
주어진 논문 정보(제목/초록)를 바탕으로 연구배경, 목적, 핵심개념, 방법, 결과를 ${grade} 학생이 이해할 수 있는 표현으로 재구성해.
반드시 JSON 배열로만 답해. 각 항목은
{"title":"","authors":"","year":0,"url":"","background":"","purpose":"","coreConcepts":["",""],"method":"","results":""} 형식이어야 해.`;

  const user = `탐구 주제: ${topic}
학생 학년: ${grade}
검색된 논문 후보:
${JSON.stringify(rawPapers, null, 2)}`;

  try {
    const raw = await askClaude(system, user);
    const parsed = JSON.parse(extractJson(raw));
    const papers: PaperSummary[] = parsed.map((p: Omit<PaperSummary, "id">, i: number) => ({
      id: `${Date.now()}-${i}`,
      ...p,
    }));
    return NextResponse.json({ papers });
  } catch {
    return NextResponse.json({ papers: mockPapers(topic) });
  }
}

// Semantic Scholar 무료 API로 관련 논문 메타데이터를 가져온다 (키 불필요, rate limit 있음).
async function searchPapers(topic: string) {
  try {
    const url = `${SEMANTIC_SCHOLAR_URL}?query=${encodeURIComponent(
      topic
    )}&limit=5&fields=title,authors,year,abstract,url`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

function extractJson(text: string) {
  const match = text.match(/\[[\s\S]*\]/);
  return match ? match[0] : "[]";
}

function mockPapers(topic: string): PaperSummary[] {
  return [
    {
      id: "mock-paper-1",
      title: `${topic} 관련 예시 논문 A`,
      authors: "예시 저자 외",
      year: 2022,
      background: "이 분야에서 기존 연구들이 놓치고 있던 문제 상황을 설명합니다. (예시 데이터)",
      purpose: "해당 문제를 해결하기 위해 이 연구가 무엇을 밝히려 했는지 설명합니다.",
      coreConcepts: ["핵심 개념 1", "핵심 개념 2"],
      method: "연구자들이 어떤 방법으로 실험/분석했는지 학생 눈높이로 설명합니다.",
      results: "연구를 통해 밝혀진 결과와 그 의미를 설명합니다.",
    },
  ];
}
