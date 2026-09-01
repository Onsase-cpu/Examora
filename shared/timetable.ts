export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
export type Slot = { day: Day; start: number; end: number };
export type Lecturer = { id: string; name: string; department: string; unavailable: Slot[] };
export type Room = { id: string; name: string; capacity: number; building: string };
export type Course = { id: string; code: string; title: string; lecturerId: string; groupIds: string[]; roomMinCapacity: number; duration: number; color: string };
export type StudentGroup = { id: string; name: string; size: number };
export type TimetableSession = Course & { roomId: string; slot: Slot; conflict?: string };
export type TimetableResult = { sessions: TimetableSession[]; conflicts: string[]; score: number; generatedAt: number };

export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

function overlaps(a: Slot, b: Slot) {
  return a.day === b.day && a.start < b.end && b.start < a.end;
}

function unavailable(lecturer: Lecturer, slot: Slot) {
  return lecturer.unavailable.some(block => overlaps(block, slot));
}

function candidateSlots(duration: number): Slot[] {
  return DAYS.flatMap(day => HOURS.filter(hour => hour + duration <= 18).map(start => ({ day, start, end: start + duration })));
}

export function generateTimetable(lecturers: Lecturer[], rooms: Room[], courses: Course[], groups: StudentGroup[]): TimetableResult {
  const lecturerMap = new Map(lecturers.map(item => [item.id, item]));
  const groupMap = new Map(groups.map(item => [item.id, item]));
  const placed: TimetableSession[] = [];
  const conflicts: string[] = [];
  const ordered = [...courses].sort((a, b) => b.roomMinCapacity - a.roomMinCapacity || b.groupIds.length - a.groupIds.length);

  for (const course of ordered) {
    const lecturer = lecturerMap.get(course.lecturerId);
    const groupSize = course.groupIds.reduce((sum, groupId) => sum + (groupMap.get(groupId)?.size ?? 0), 0);
    const room = rooms.filter(item => item.capacity >= Math.max(course.roomMinCapacity, groupSize)).sort((a, b) => a.capacity - b.capacity)[0];
    let chosen: TimetableSession | undefined;
    for (const slot of candidateSlots(course.duration)) {
      if (!lecturer || unavailable(lecturer, slot)) continue;
      const roomConflict = placed.find(item => item.roomId === room?.id && overlaps(item.slot, slot));
      const lecturerConflict = placed.find(item => item.lecturerId === course.lecturerId && overlaps(item.slot, slot));
      const groupConflict = placed.find(item => item.groupIds.some(id => course.groupIds.includes(id)) && overlaps(item.slot, slot));
      if (!roomConflict && !lecturerConflict && !groupConflict && room) {
        chosen = { ...course, roomId: room.id, slot };
        break;
      }
    }
    if (chosen) placed.push(chosen);
    else {
      const reason = !room ? `${course.code}: no room meets capacity` : `${course.code}: no conflict-free slot found`;
      conflicts.push(reason);
      placed.push({ ...course, roomId: rooms[0]?.id ?? "unassigned", slot: { day: "Mon", start: 8, end: 8 + course.duration }, conflict: reason });
    }
  }
  return { sessions: placed.sort((a, b) => DAYS.indexOf(a.slot.day) - DAYS.indexOf(b.slot.day) || a.slot.start - b.slot.start), conflicts, score: Math.max(0, Math.round(100 - conflicts.length * 14 - placed.filter(item => item.conflict).length * 4)), generatedAt: Date.now() };
}

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}
