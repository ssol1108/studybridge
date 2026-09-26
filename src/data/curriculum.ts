import { Subject } from "@/types";
import curriculumData from "./curriculum.json";

// 실제 데이터는 curriculum.json에 있음 — 과목/단원을 추가·수정할 때는 이 .ts가 아니라
// curriculum.json 파일을 편집하면 됨.
//
// 2022 개정 교육과정 고시 목차(국어~영어 12개 교과군) 기준 전체 과목(108개) 등록 완료.
// 단원(units)은 아직 비어 있음 — 교과별 학습목표/영역 자료(PDF)를 받는 대로 채울 예정.
// 참고 자료:
//  - 국가교육과정정보센터(NCIC) https://ncic.re.kr — 개정 교육과정 고시 원문·해설서 열람
//  - 교육부 홈페이지(moe.go.kr) 정책자료 > 교육과정 고시문(별책 PDF)
//  - 한국교육과정평가원(KICE), 각 시·도교육청 배포 교육과정 편성표
export const SUBJECTS: Subject[] = curriculumData;
