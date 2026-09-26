import { NextRequest, NextResponse } from "next/server";
import { askClaude, hasClaudeKey } from "@/lib/claude";
import { PaperSummary } from "@/types";

// 논문 3개 학습을 모두 마쳤을 때: 주제 + 논문 3개 핵심 내용을 하나로 엮은 정리글 생성.
export async function POST(req: NextRequest) {
  const {
    topic,
    papers,
    grade,
  }: { topic: string; papers: PaperSummary[]; grade: string } = await req.json();

  if (!topic || !papers?.length || !grade) {
    return NextResponse.json(
      { error: "topic, papers, grade는 필수입니다." },
      { status: 400 }
    );
  }

  if (!hasClaudeKey()) {
    return NextResponse.json({ summary: mockSummary(topic, papers) });
  }

  const system = `너는 학생의 탐구 학습을 마무리 정리해주는 코치야.
학생은 하나의 융합 탐구 주제를 정하고, 그 주제를 뒷받침하는 논문 여러 편을 각각 배경지식부터
단계별로 학습해서 전부 이해했어. 주제와 각 논문의 핵심 내용이 서로 어떻게 연결되는지 짚어주면서,
학생이 이번 학습에서 무엇을 배웠는지 하나의 흐름으로 정리하는 요약문을 작성해.
${grade} 학생이 이해할 수 있는 표현을 쓰고, 3~5문단 정도 분량으로, 각 논문을 한 번씩은
언급하면서 마지막엔 격려하는 문장으로 마무리해. 문단 구분은 줄바꿈 두 번으로 해.
반드시 정리글 본문 텍스트만 출력하고, 다른 설명이나 JSON은 쓰지 마.`;

  const user = `탐구 주제: ${topic}
학생 학년: ${grade}
학습한 논문들:
${papers
  .map(
    (p, i) => `${i + 1}. ${p.title}
   - 핵심 개념: ${p.coreConcepts.join(", ")}
   - 연구 목적: ${p.purpose}
   - 연구 결과: ${p.results}`
  )
  .join("\n")}`;

  try {
    const summary = await askClaude(system, user);
    return NextResponse.json({ summary: summary.trim() });
  } catch (err) {
    console.error("summarize-learning: Claude 호출 실패, mock으로 대체", err);
    return NextResponse.json({ summary: mockSummary(topic, papers) });
  }
}

function mockSummary(topic: string, papers: PaperSummary[]): string {
  const paperLines = papers
    .map((p, i) => `${i + 1}. ${p.title} — 핵심 개념: ${p.coreConcepts.join(", ")}`)
    .join("\n");

  return `"${topic}" 주제로 논문 ${papers.length}편을 배경지식부터 단계별로 학습하고 모든 퀴즈를 통과했습니다.

학습한 논문:
${paperLines}

각 논문은 서로 다른 각도에서 이 주제에 접근하고 있지만, 공통적으로 주제가 다루는 핵심 현상을
설명하는 데 필요한 개념들을 제공합니다. (예시 정리글 - 실시간 생성 대신 표시됨)

수고했어요! 이제 이 논문들의 핵심 내용을 스스로의 언어로 설명할 수 있을 거예요.`;
}
