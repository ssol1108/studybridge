import { Subject } from "@/types";

// TODO: 2022 개정 교육과정 고시(교육부) 기준 전체 과목/단원 데이터로 교체 필요.
// 지금은 데모용으로 계열별 대표 과목 몇 개만 넣어두었습니다.
export const SUBJECTS: Subject[] = [
  {
    id: "physics1",
    name: "물리학Ⅰ",
    units: ["역학과 에너지", "전기와 자기", "빛과 물질"],
  },
  {
    id: "life-science1",
    name: "생명과학Ⅰ",
    units: ["생명시스템", "항상성과 몸의 조절", "유전"],
  },
  {
    id: "chemistry1",
    name: "화학Ⅰ",
    units: ["화학의 언어", "물질의 상태와 용액", "화학 평형"],
  },
  {
    id: "earth-science1",
    name: "지구과학Ⅰ",
    units: ["대기와 해양", "태양계 우주", "지구 시스템"],
  },
  {
    id: "economics",
    name: "경제",
    units: ["시장과 경제활동", "국가 경제", "세계 경제와 상호 의존"],
  },
  {
    id: "informatics",
    name: "정보",
    units: ["컴퓨팅 시스템", "데이터", "알고리즘과 프로그래밍", "인공지능"],
  },
];
