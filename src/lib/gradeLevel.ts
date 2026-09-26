import { Grade } from "@/types";

// Subject.typicalGrade는 "고1" / "고2~3" / "고1~3" 같은 느슨한 범위 문자열이라
// 여기서 실제 Grade 배열로 풀어서 포함 여부를 판단한다.
function gradesInRange(typicalGrade: string): Grade[] {
  if (typicalGrade === "고1") return ["고1"];
  if (typicalGrade === "고2~3") return ["고2", "고3"];
  if (typicalGrade === "고1~3") return ["고1", "고2", "고3"];
  return [];
}

export function isGradeTypical(grade: Grade, typicalGrade: string): boolean {
  return gradesInRange(typicalGrade).includes(grade);
}

// 학년-과목 조합이 어긋날 때, 프롬프트에 끼워 넣을 안내 문장을 만든다.
export function buildLevelNote(
  grade: Grade,
  subjectName: string,
  typicalGrade: string
): string | undefined {
  if (isGradeTypical(grade, typicalGrade)) return undefined;
  return `이 학생의 학년(${grade})은 "${subjectName}"을 보통 배우는 학년대(${typicalGrade})와 다릅니다. 학생이 이 과목을 아직 정식으로 배우지 않았을 수 있으니, 관련 배경지식을 더 기초적인 단계부터 쉽게 설명해주세요.`;
}
