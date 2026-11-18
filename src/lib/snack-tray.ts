export const cocoaSyrups = [
  { id: "honey", name: "น้ำผึ้ง", emoji: "🍯", tone: "honey" },
  { id: "caramel", name: "คาราเมล", emoji: "🍮", tone: "caramel" },
  { id: "mint", name: "มินต์", emoji: "🌿", tone: "mint" },
  { id: "vanilla", name: "วานิลลา", emoji: "🌼", tone: "vanilla" },
] as const;

export const cocoaToppings = [
  { id: "cream", name: "วิปครีม", emoji: "🍦" },
  { id: "marshmallow", name: "มาร์ชเมลโลว์", emoji: "☁️" },
  { id: "snowman", name: "มาร์ชเมลโลว์สโนว์แมน", emoji: "⛄" },
  { id: "star", name: "มาร์ชเมลโลว์ดาว", emoji: "⭐" },
  { id: "sprinkles", name: "เกล็ดน้ำตาล", emoji: "✨" },
] as const;

export const trayTreats = [
  { key: "candy-cane", name: "แคนดี้เคน", emoji: "🍭", group: "treat" },
  { key: "gingerbread", name: "คุกกี้ขิง", emoji: "🍪", group: "treat" },
  { key: "star-cookie", name: "คุกกี้ดาว", emoji: "⭐", group: "treat" },
  { key: "snowflake-cookie", name: "คุกกี้เกล็ดหิมะ", emoji: "❄️", group: "treat" },
  { key: "macaron", name: "มาการอง", emoji: "🍬", group: "treat" },
  { key: "pudding", name: "พุดดิ้ง", emoji: "🍮", group: "treat" },
  { key: "candy", name: "ลูกกวาด", emoji: "🍬", group: "decor" },
  { key: "choco-star", name: "ดาวช็อกโกแลต", emoji: "🌟", group: "decor" },
  { key: "holly", name: "ฮอลลี่", emoji: "🍃", group: "decor" },
] as const;

export type TrayItemKey = typeof trayTreats[number]["key"];
export type PlacedTrayItem = { key: TrayItemKey; x: number; y: number; rotation: number };

export const syrupById = (id: string) => cocoaSyrups.find((item) => item.id === id) ?? cocoaSyrups[0];
export const toppingById = (id: string) => cocoaToppings.find((item) => item.id === id);
export const trayTreatByKey = (key: string) => trayTreats.find((item) => item.key === key);
