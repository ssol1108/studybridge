# StudyBridge

2022 개정 교육과정 과목과 학생의 전공/관심 분야를 연결해 융합 탐구 주제를 추천하고,
관련 논문을 찾아 학생 눈높이로 재구성한 뒤, 논문 이해에 필요한 배경지식을 단계별 퀴즈(정답률 80% 게이트)로
학습시키는 서비스입니다.

## 학습 흐름

1. **융합 탐구 주제 추천** — 과목(+단원), 학년, 전공/관심분야를 입력하면 융합 탐구 주제 후보를 제안합니다.
2. **근거 논문 탐색 & 재구성** — 선택한 주제를 바탕으로 논문을 찾고, 연구배경/목적/핵심개념/방법/결과를
   학생 학년에 맞는 표현으로 재구성합니다.
3. **배경지식 개념 선별** — 논문 이해에 필요한 핵심 개념을 학년/수준에 맞게 선별하고 쉬운 설명을 제공합니다.
4. **단계별 학습 + 퀴즈 게이트** — 개념을 한 단계씩 학습 → 퀴즈로 확인 → 정답률 80% 이상이어야 다음 단계로
   진행, 미만이면 해당 단계를 재학습합니다.

## 기술 스택

- **Next.js (App Router) + TypeScript + Tailwind CSS** — 프론트엔드/백엔드(API Routes) 통합
- **Anthropic Claude API** — 주제 제안, 논문 재구성, 배경지식 설명, 퀴즈 생성 (`ANTHROPIC_API_KEY` 필요)
- **Semantic Scholar API** — 논문 메타데이터/초록 검색 (키 불필요)

`ANTHROPIC_API_KEY`가 설정되지 않은 상태에서도 각 API route는 mock 데이터로 응답하므로,
프론트엔드 흐름은 키 없이도 확인할 수 있습니다.

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # ANTHROPIC_API_KEY 입력
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## 프로젝트 구조

```
src/
  app/
    page.tsx                # 4단계 학습 흐름을 오케스트레이션하는 메인 페이지
    api/
      suggest-topic/         # 기능 1: 융합 탐구 주제 제안
      find-papers/           # 기능 2: 논문 검색 + 학생 눈높이 재구성
      generate-steps/        # 기능 3: 배경지식 개념 단계 생성
      quiz/check/            # 기능 4: 퀴즈 채점 (80% 게이트)
  components/                # TopicForm, TopicResult, PaperList, LearningStep
  data/curriculum.ts         # 2022 개정 교육과정 과목/단원 데이터 (현재 데모용 일부만 포함)
  lib/claude.ts              # Anthropic API 호출 헬퍼
  types/index.ts             # 공통 타입 정의
```

더 자세한 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.
