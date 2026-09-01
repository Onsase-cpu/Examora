import { describe, expect, it } from "vitest";
import { generateTimetable, type Course, type Lecturer, type Room, type StudentGroup } from "./timetable";

describe("Timbrio constraint solver", () => {
  const lecturers: Lecturer[] = [{ id: "l1", name: "A", department: "CS", unavailable: [{ day: "Mon", start: 8, end: 12 }] }];
  const rooms: Room[] = [{ id: "small", name: "Small", capacity: 20, building: "A" }, { id: "large", name: "Large", capacity: 80, building: "B" }];
  const groups: StudentGroup[] = [{ id: "g1", name: "Year 1", size: 60 }];
  const course: Course = { id: "c1", code: "CSC 101", title: "Foundations", lecturerId: "l1", groupIds: ["g1"], roomMinCapacity: 50, duration: 2, color: "violet" };

  it("selects a room that meets capacity and avoids lecturer blocks", () => {
    const result = generateTimetable(lecturers, rooms, [course], groups);
    expect(result.sessions[0]?.roomId).toBe("large");
    expect(result.sessions[0]?.slot.start).not.toBe(8);
    expect(result.conflicts).toHaveLength(0);
  });

  it("flags an unschedulable course when capacity cannot be met", () => {
    const result = generateTimetable(lecturers, rooms, [{ ...course, roomMinCapacity: 200 }], groups);
    expect(result.conflicts[0]).toContain("no room meets capacity");
    expect(result.sessions[0]?.conflict).toBeTruthy();
  });

  it("prevents the same student group from overlapping", () => {
    const result = generateTimetable(lecturers, rooms, [course, { ...course, id: "c2", code: "CSC 102" }], groups);
    const first = result.sessions[0];
    const second = result.sessions[1];
    expect(first?.slot.day !== second?.slot.day || first?.slot.end <= second?.slot.start || second?.slot.end <= first?.slot.start).toBe(true);
  });
});
