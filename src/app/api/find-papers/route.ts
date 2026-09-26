import { NextRequest, NextResponse } from "next/server";
import { askClaude, hasClaudeKey } from "@/lib/claude";
import { PaperSummary } from "@/types";

const SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search";

// 기능 2: 주제 기반 논문 검색 + 학생 눈높이로 핵심 내용 재구성
export async function POST(req: NextRequest) {
  const { topic, searchQuery, grade } = await req.json();

  if (!topic || !grade) {
    return NextResponse.json({ error: "topic, grade는 필수입니다." }, { status: 400 });
  }

  // Semantic Scholar는 영어 논문 위주라 한국어 topic을 그대로 검색하면 결과가 거의 안 나온다.
  // suggest-topic이 만들어준 영어 searchQuery로 검색하고, 없으면(구버전 호출 등) topic으로 대체.
  const rawPapers = await searchPapers(searchQuery || topic);

  if (!hasClaudeKey()) {
    return NextResponse.json({ papers: mockPapers(topic) });
  }

  const system = `너는 학생이 논문을 쉽게 이해하도록 돕는 학습 코치야.
검색된 논문 후보 중 탐구 주제와 가장 관련 있는 논문을 최대 3개까지 골라,
각각의 연구배경, 목적, 핵심개념, 방법, 결과를 ${grade} 학생이 이해할 수 있는 표현으로 재구성해.
학생이 하나씩 비교해서 고를 수 있도록 서로 다른 논문 2~3개를 골라야 해 (후보가 1개뿐이면 1개만).
coreConcepts(핵심개념) 개수는 절대 2개로 제한하지 말고, 그 논문을 이해하는 데 실제로 필요한
개념 수만큼 자유롭게 나열해 (보통 2~6개 정도이지만 논문 내용에 따라 더 많아도 됨).
각 핵심개념은 이후 학생이 배경지식을 단계별로 학습할 하나의 단계가 되니, 서로 구별되는
독립적인 개념으로 나눠줘.
중요: 검색된 논문 후보 목록이 비어 있으면, 절대 실존하는 논문인 것처럼 저자명·연도를
지어내지 마. 대신 title을 "(예시) ..."로 시작하고 authors는 "실제 논문 아님 - 예시"라고
명시해서, 학생이 이게 진짜 논문이 아니라 이 주제에서 나올 법한 연구 방향의 예시라는 걸
분명히 알 수 있게 해.
반드시 JSON 배열로만 답해. 각 항목은
{"title":"","authors":"","year":0,"url":"","background":"","purpose":"","coreConcepts":["...필요한 만큼"],"method":"","results":""} 형식이어야 해.`;

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
  } catch (err) {
    console.error("find-papers: Claude 호출/파싱 실패, mock으로 대체", err);
    return NextResponse.json({ papers: mockPapers(topic) });
  }
}

// Semantic Scholar 논문 메타데이터 검색.
// query는 영어 키워드여야 검색이 잘 된다 (한국어로 넣으면 결과가 거의 안 나옴).
// 키 없이 쓰면 IP당 rate limit이 매우 낮아 공유 환경에서는 429가 자주 뜬다 — 이땐 그냥
// 빈 배열을 반환하고, find-papers 프롬프트가 "실제 논문 아님"을 명시하도록 처리해둠.
// SEMANTIC_SCHOLAR_API_KEY를 넣으면 훨씬 높은 한도로 검색된다 (무료 신청 가능).
async function searchPapers(query: string) {
  try {
    const url = `${SEMANTIC_SCHOLAR_URL}?query=${encodeURIComponent(
      query
    )}&limit=5&fields=title,authors,year,abstract,url`;
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    const res = await fetch(url, {
      headers: apiKey ? { "x-api-key": apiKey } : undefined,
    });
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
  // 논문마다 핵심개념 개수가 다를 수 있음을 예시로 보여주기 위해 2/3/4개로 다르게 구성.
  const labels = ["A", "B", "C"];
  const conceptCounts = [2, 3, 4];
  let conceptSeq = 0;
  return labels.map((label, i) => {
    const coreConcepts = Array.from({ length: conceptCounts[i] }, () => {
      conceptSeq += 1;
      return `핵심 개념 ${conceptSeq}`;
    });
    return {
      id: `mock-paper-${i + 1}`,
      title: `${topic} 관련 예시 논문 ${label}`,
      authors: "예시 저자 외",
      year: 2021 + i,
      background: "이 분야에서 기존 연구들이 놓치고 있던 문제 상황을 설명합니다. (예시 데이터)",
      purpose: "해당 문제를 해결하기 위해 이 연구가 무엇을 밝히려 했는지 설명합니다.",
      coreConcepts,
      method: "연구자들이 어떤 방법으로 실험/분석했는지 학생 눈높이로 설명합니다.",
      results: "연구를 통해 밝혀진 결과와 그 의미를 설명합니다.",
    };
  });
}
