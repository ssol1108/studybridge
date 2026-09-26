import { Subject } from "@/types";
import curriculumData from "./curriculum.json";

// 실제 데이터는 curriculum.json에 있음 — 과목/단원을 추가·수정할 때는 이 .ts가 아니라
// curriculum.json 파일을 편집하면 됨.
//
// TODO: 2022 개정 교육과정 고시(교육부) 기준 전체 과목/단원 데이터로 교체 필요.
// 참고 자료:
//  - 국가교육과정정보센터(NCIC) https://ncic.re.kr — 개정 교육과정 고시 원문·해설서 열람
//  - 교육부 홈페이지(moe.go.kr) 정책자료 > 교육과정 고시문(별책 PDF)
//  - 한국교육과정평가원(KICE), 각 시·도교육청 배포 교육과정 편성표
// 위 자료들은 대부분 PDF/HWP 형태로만 배포되어 공식 JSON/API가 없으므로,
// 고시문에서 과목명·영역(단원)을 직접 옮겨 curriculum.json 형태로 정리해야 함.
export const SUBJECTS: Subject[] = curriculumData;
