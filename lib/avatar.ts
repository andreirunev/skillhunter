// Anonymous avatar: emoji + colour + generated nickname. Never a real name.

const ANIMALS: [string, string][] = [
  ["🦊", "Fox"], ["🦉", "Owl"], ["🐢", "Turtle"], ["🐬", "Dolphin"], ["🦦", "Otter"], ["🐝", "Bee"],
  ["🦔", "Hedgehog"], ["🐧", "Penguin"], ["🦋", "Butterfly"], ["🐳", "Whale"], ["🐿️", "Squirrel"], ["🦌", "Deer"],
  ["🦫", "Beaver"], ["🐻", "Bear"], ["🦢", "Swan"], ["🐸", "Frog"],
];
const WORDS = ["Calm", "Bright", "Swift", "Brave", "Kind", "Clever", "Steady", "Sunny", "Quiet", "Bold", "Gentle", "Keen"];
// Blues and greens.
const COLORS = ["#2563EB", "#0891B2", "#059669", "#16A34A", "#0D9488", "#4F46E5", "#0284C7", "#65A30D"];

export type Avatar = { name: string; emoji: string; color: string };

export function makeAvatar(rand: () => number = Math.random): Avatar {
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const [emoji, animal] = pick(ANIMALS);
  return { name: `${pick(WORDS)} ${animal}`, emoji, color: pick(COLORS) };
}
