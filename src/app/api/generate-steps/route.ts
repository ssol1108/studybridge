import { NextRequest, NextResponse } from "next/server";
import { askClaude, hasClaudeKey } from "@/lib/claude";
import { ConceptStep, PaperSummary } from "@/types";

// 기능 3, 4: 논문 이해에 필요한 배경지식을 단계별(개념 설명 + 퀴즈)로 생성
export async function POST(req: NextRequest) {
  const {
    paper,
    grade,
    levelNote,
  }: { paper: PaperSummary; grade: string; levelNote?: string } = await req.json();

  if (!paper || !grade) {
    return NextResponse.json({ error: "paper, grade는 필수입니다." }, { status: 400 });
  }

  if (!hasClaudeKey()) {
    return NextResponse.json({ steps: mockSteps(paper) });
  }

  const system = `너는 학생 맞춤 커리큘럼 설계자야.
아래 논문 핵심 개념을 학생이 이해하려면 어떤 배경지식이 필요한지 단계별로 쪼개.
각 단계는 하나의 핵심 개념만 다루고, 쉬운 설명과 확인용 퀴즈 3문제를 포함해야 해.
퀴즈 3문제 중 2문제는 4지선다(type: "multiple-choice"), 1문제는 단답형(type: "short-answer")으로
구성해. 단답형은 학생이 짧은 단어/구를 직접 입력하는 문제이고, 채점은 정답 목록과의 문자열
비교로만 이뤄지니 acceptableAnswers에 정답으로 인정할 표현을 2~4개(다른 표기, 줄임말 등
정규화하면 같은 답이 되는 것들) 배열로 반드시 포함해야 해.
반드시 JSON 배열로만 답해. 각 항목은 아래 형식이어야 해:
{"order":1,"concept":"","explanation":"","quiz":[
{"type":"multiple-choice","question":"","options":["","","",""],"answerIndex":0},
{"type":"multiple-choice","question":"","options":["","","",""],"answerIndex":0},
{"type":"short-answer","question":"","acceptableAnswers":["",""]}
]}`;

  const user = `학생 학년: ${grade}
논문 핵심개념: ${paper.coreConcepts.join(", ")}
논문 방법: ${paper.method}
논문 결과: ${paper.results}${levelNote ? `\n참고: ${levelNote}` : ""}`;

  try {
    const raw = await askClaude(system, user);
    const parsed = JSON.parse(extractJson(raw));
    const steps: ConceptStep[] = parsed.map(
      (s: Omit<ConceptStep, "id" | "quiz"> & { quiz: Array<Omit<ConceptStep["quiz"][number], "id">> }, i: number) => ({
        id: `${Date.now()}-${i}`,
        ...s,
        quiz: s.quiz.map((q, qi) => ({ id: `${Date.now()}-${i}-${qi}`, ...q })),
      })
    );
    return NextResponse.json({ steps });
  } catch {
    return NextResponse.json({ steps: mockSteps(paper) });
  }
}

function extractJson(text: string) {
  const match = text.match(/\[[\s\S]*\]/);
  return match ? match[0] : "[]";
}

function mockSteps(paper: PaperSummary): ConceptStep[] {
  return paper.coreConcepts.map((concept, i) => ({
    id: `mock-step-${i}`,
    order: i + 1,
    concept,
    explanation: `"${concept}"에 대한 학생 눈높이 설명입니다. (ANTHROPIC_API_KEY 미설정 상태의 예시 데이터)`,
    quiz: [
      {
        id: `mock-step-${i}-q1`,
        type: "multiple-choice",
        question: `"${concept}"에 대한 설명으로 옳은 것은?`,
        options: ["예시 보기 1", "예시 보기 2", "예시 보기 3", "예시 보기 4"],
        answerIndex: 0,
      },
      {
        id: `mock-step-${i}-q2`,
        type: "multiple-choice",
        question: `"${concept}"과 관련 없는 것은?`,
        options: ["예시 보기 1", "예시 보기 2", "예시 보기 3", "예시 보기 4"],
        answerIndex: 1,
      },
      {
        id: `mock-step-${i}-q3`,
        type: "short-answer",
        question: `"${concept}"을 한 단어로 표현하면?`,
        acceptableAnswers: [concept],
      },
    ],
  }));
}
