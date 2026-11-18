export const controlledActivities = [
  { id: "secret-santa", title: "Secret Santa", href: "/secret-santa", icon: "🎁", note: "ของขวัญกำลังรอเวลาเปิดกล่อง" },
  { id: "maple-road", title: "Maple Rd. No.12", href: "/maple-road", icon: "🏠", note: "ไฟในบ้านยังปิดม่านไว้ก่อนนะ" },
  { id: "christmas-tree", title: "ต้นคริสต์มาส", href: "/christmas-tree", icon: "🎄", note: "ต้นไม้กำลังรอวันประดับไฟ" },
  { id: "christmas-checklist", title: "12 Days Before Christmas", href: "/christmas-checklist", icon: "🚂", note: "รถไฟยังไม่ออกจากสถานี" },
] as const;

export type ControlledActivityId = (typeof controlledActivities)[number]["id"];
