import { describe, expect, it } from "vitest";
import { gradeScore, roomUtilisation, transcriptLine, type Exam, type Room, type Candidate } from "./exam";

describe("Examora exam domain", () => {
  it("maps scores to transparent grade bands", () => {
    expect(gradeScore(82, 100)).toMatchObject({ percentage: 82, grade: "A", remark: "Distinction" });
    expect(gradeScore(54, 100).grade).toBe("D");
    expect(gradeScore(40, 100).grade).toBe("F");
  });
  it("calculates room utilisation safely", () => {
    const rooms: Room[] = [{ id: "r", name: "Main", capacity: 200, assigned: 150, building: "A" }];
    expect(roomUtilisation(rooms)).toBe(75);
  });
  it("creates typed transcript result lines", () => {
    const exam: Exam = { id: "e", code: "CSC 304", title: "Database Systems", subject: "CS", date: "Oct 21", duration: "2h", status: "Published", questions: [{ id: "q", prompt: "Explain", marks: 100, topic: "DB", type: "Essay" }], candidateCount: 1, room: "Main" };
    const candidate: Candidate = { id: "c", name: "Amina Yusuf", index: "CSC/1", programme: "BSc CS", examId: "e", score: 88 };
    expect(transcriptLine(candidate, exam)).toMatchObject({ candidateId: "c", examId: "e", maximum: 100, percentage: 88, grade: "A" });
  });
});
