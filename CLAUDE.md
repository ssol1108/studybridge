@AGENTS.md

# StudyBridge — 프로젝트 가이드

## 서비스 개요

2022 개정 교육과정 과목과 학생의 전공/관심 분야를 연결해 융합 탐구 주제를 추천하고,
그 주제의 근거가 되는 논문을 찾아 학생 학년 수준에 맞게 재구성한 뒤,
논문 이해에 필요한 배경지식을 단계별 퀴즈 게이트(정답률 80%)를 통해 학습시키는 웹 서비스.

핵심 목표는 "주제/논문 추천"에서 끝나지 않고, 사용자가 자기 학년 수준에서 필요한 개념을
차례로 학습해 최종적으로 논문의 핵심 내용을 스스로 이해하도록 돕는 것.

## 기능별 요구사항 → 구현 위치

1. **융합 탐구 주제 제안**
   - 입력: 과목(2022 개정 교육과정), 학년(고1~고3만 지원), 전공/관심분야, (선택) 단원
   - 구현: [src/components/TopicForm.tsx](src/components/TopicForm.tsx),
     [src/app/api/suggest-topic/route.ts](src/app/api/suggest-topic/route.ts)
   - 학년 범위: [src/types/index.ts](src/types/index.ts)의 `Grade` 타입 = `"고1" | "고2" | "고3"`.
     범위를 넓히려면 이 타입과 [TopicForm.tsx](src/components/TopicForm.tsx)의 `GRADES` 배열을 같이 수정.
   - 과목/단원 데이터: [src/data/curriculum.json](src/data/curriculum.json)
     ([src/data/curriculum.ts](src/data/curriculum.ts)가 이 JSON을 그대로 불러와 export함 —
     과목/단원을 추가·수정할 때는 .ts가 아니라 .json 파일을 편집할 것)
     — 국어・사회・도덕・수학・과학・기술가정・정보・영어 8개 교과군, 총 95개 과목이 들어있고
     (2022 개정 교육과정 고시문 목차 기준), `category` 필드로 교과군을 구분해 TopicForm의
     드롭다운을 optgroup으로 묶음. 예체능(체육/음악/미술)은 사용자 요청으로 세부과목을
     나열하지 않고 대표 과목 1개씩만 남김(연극과는 제외).
   - 단원(`units`)은 국어・사회・도덕・수학・과학・기술가정・정보・영어 95개 중 80개는
     교육부 고시 별책(국어5, 사회7, 도덕6, 수학8, 과학9, 실과·정보10, 영어14) PDF의
     "내용 체계" 표에 나오는 실제 "영역" 이름으로 채워져 있음 — poppler(pdftotext)로
     텍스트 추출 후 서브에이전트가 원문 대조하여 옮김. 나머지 15개(국어 선택과목 9개,
     영어 진로/융합선택 과목 3개, 예체능 3개)는 원문에 영역 구분이 아예 없거나(국어/영어)
     아직 자료를 받지 못해서(예체능) `units: []`로 비어있음 — 빈 배열이면 "전체 단원"만
     선택 가능하도록 이미 처리되어 있어 UI상 문제는 없음.
   - 공식 JSON/API가 없으므로 국가교육과정정보센터(NCIC, https://ncic.re.kr)나 교육부
     고시문(PDF)이 유일한 출처. curriculum.ts 상단 주석에도 정리해둠.

2. **근거 논문 탐색 + 학생 눈높이 재구성**
   - 논문 메타데이터/초록은 Semantic Scholar API로 검색 (키 불필요, rate limit 있음, limit=5)
   - Claude에게 후보 중 주제와 가장 관련 있는 논문을 최대 3개까지 골라 재구성하도록 요청
     (연구배경/목적/핵심개념/방법/결과, 학년별 눈높이)
   - 구현: [src/app/api/find-papers/route.ts](src/app/api/find-papers/route.ts),
     [src/components/PaperList.tsx](src/components/PaperList.tsx)
   - UI는 논문 카드를 여러 개 나열하고 학생이 그중 하나를 클릭해 배경지식 학습을 시작하는
     구조 (`PaperList`가 `papers.map`으로 렌더링, [src/app/page.tsx](src/app/page.tsx)의
     `handlePaperSelect`가 선택된 논문 하나로 다음 단계 진행)
   - 국내 논문(RISS/DBpia)은 공식 API가 제한적이라 아직 미연동. 필요 시 사용자가
     직접 논문 텍스트를 붙여넣는 입력 경로를 추가하는 방향을 고려.

3. **배경지식 핵심 개념 선별 + 학년별 설명**
   - 선택한 논문의 핵심 개념을 학년/수준에 맞게 쪼개고 쉬운 설명 생성
   - 구현: [src/app/api/generate-steps/route.ts](src/app/api/generate-steps/route.ts)

4. **단계별 학습 + 퀴즈 게이트 (정답률 80%)**
   - 한 단계 = 개념 설명 1개 + 확인 퀴즈. 80% 미만이면 재학습, 이상이면 다음 단계 진행.
   - 게이트 기준(`PASS_RATE = 0.8`)은 [src/app/api/quiz/check/route.ts](src/app/api/quiz/check/route.ts)
     에 정의되어 있음. 기준을 바꾸려면 이 상수만 수정.
   - UI/진행 로직: [src/components/LearningStep.tsx](src/components/LearningStep.tsx)
   - 전체 흐름(주제→논문→학습 단계) 오케스트레이션: [src/app/page.tsx](src/app/page.tsx)
     (현재는 세션 내 React state로만 진행 상태를 관리 — 새로고침하면 초기화됨)

## 아키텍처 메모

- Next.js App Router 하나로 프론트엔드 + API Routes(백엔드)를 함께 운영.
- LLM 호출은 전부 [src/lib/claude.ts](src/lib/claude.ts)의 `askClaude()`를 통과.
  `ANTHROPIC_API_KEY`가 없으면 각 API route가 자체 mock 데이터로 응답하므로
  키 없이도 프론트엔드 흐름 전체를 확인할 수 있음.
- 각 API route는 Claude 응답을 JSON 배열로 강제하는 프롬프트를 쓰고, 파싱 실패 시
  mock 데이터로 fallback — 프롬프트를 바꿀 때 이 파싱 계약(JSON 배열)을 유지할 것.

## 아직 없는 것 (다음 작업 후보)

- 사용자 인증 및 학습 진행 상태 영속화 (현재는 DB 없음, 새로고침하면 초기화)
- 예체능(체육/음악/미술) 단원 데이터 — 사용자가 해당 PDF를 나중에 보내주기로 함
- 국내 논문 검색 연동
- 퀴즈 문항 수/난이도를 학년별로 조정하는 로직

## 개발 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## 환경 변수

`.env.local.example` 참고. `ANTHROPIC_API_KEY`만 있으면 됨(Semantic Scholar는 키 불필요).
