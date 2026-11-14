import type { Option, Sector, TaskDef } from "./tasks.ts";

// Suggested sector packs. Companies copy tasks from here into their own test
// (or write custom ones). Language-light: emoji and short labels.
// Options are listed in the order the candidate sees them (already scrambled).

const o = (id: string, label: string, emoji?: string): Option => ({ id, label, emoji });

export type Pack = { sector: Sector; name: string; emoji: string; blurb: string; tasks: TaskDef[] };

const general: TaskDef[] = [
  {
    id: "gen-pattern", sector: "general", skill: "logical", type: "choice", expectedSec: 20,
    payload: {
      title: "What comes next", prompt: "What comes next?", emoji: "🔴 🔵 🔴 🔵 🔴 ❔", layout: "grid",
      options: [o("a", "", "🔴"), o("b", "", "🔵"), o("c", "", "🟢"), o("d", "", "🟡")],
    },
    key: { value: "b" },
    followUps: ["How did you spot the pattern?", "Where have you used pattern-spotting at work?"],
  },
  {
    id: "gen-series", sector: "general", skill: "logical", type: "number", expectedSec: 25,
    payload: { title: "Number series", prompt: "2 → 4 → 8 → 16 → ?", emoji: "🔢" },
    key: { value: 32 },
    followUps: ["What rule did you find?", "How would you double-check your answer?"],
  },
  {
    id: "gen-rotate", sector: "general", skill: "spatial", type: "choice", expectedSec: 20,
    payload: {
      title: "Turn the arrow", prompt: "Turn ➡️ a quarter turn clockwise. Which arrow do you get?", layout: "grid",
      options: [o("a", "", "⬇️"), o("b", "", "⬅️"), o("c", "", "⬆️"), o("d", "", "↘️")],
    },
    key: { value: "a" },
    followUps: ["How did you picture the turn?", "When do you imagine objects turning at work, e.g. reading a plan or map?"],
  },
  {
    id: "gen-apples", sector: "general", skill: "attention", type: "multi", expectedSec: 20,
    payload: {
      title: "Spot the green apples", prompt: "Tap every green apple 🍏", layout: "grid",
      options: [o("a", "", "🍏"), o("b", "", "🍎"), o("c", "", "🍏"), o("d", "", "🍐"), o("e", "", "🍎"), o("f", "", "🍏")],
    },
    key: { value: ["a", "c", "f"] },
    followUps: ["How did you make sure you did not miss one?", "Tell me about a job where you had to check details carefully."],
  },
  {
    id: "gen-tea", sector: "general", skill: "procedural", type: "order", expectedSec: 30,
    payload: {
      title: "Make tea", prompt: "Put the steps in order.",
      options: [o("a", "Serve", "☕"), o("b", "Boil water", "🔥"), o("c", "Wait 3 minutes", "⏳"), o("d", "Pour water on the tea", "💧")],
    },
    key: { value: ["b", "d", "c", "a"] },
    followUps: ["Which step can never be skipped?", "How do you learn the order of steps in a new job?"],
  },
];

const cleaning: TaskDef[] = [
  {
    id: "cln-mix", sector: "cleaning", skill: "safety", type: "choice", expectedSec: 25,
    payload: {
      title: "Never mix", prompt: "Which two must NEVER be mixed?",
      options: [o("a", "Bleach + ammonia cleaner", "🧴"), o("b", "Soap + water", "🧼"), o("c", "Lemon + water", "🍋"), o("d", "Sponge + bucket", "🧽")],
    },
    key: { value: "a" },
    followUps: ["What can happen if they are mixed?", "Where do you check if you are unsure about a product?"],
  },
  {
    id: "cln-room", sector: "cleaning", skill: "procedural", type: "order", expectedSec: 35,
    payload: {
      title: "Clean a room", prompt: "Put the cleaning steps in order.",
      options: [o("a", "Mop the floor", "🧽"), o("b", "Empty the bins", "🗑️"), o("c", "Sweep the floor", "🧹"), o("d", "Dust high surfaces", "⬆️")],
    },
    key: { value: ["b", "d", "c", "a"] },
    followUps: ["Why does this order matter?", "What do you do if people are still using the room?"],
  },
  {
    id: "cln-colours", sector: "cleaning", skill: "procedural", type: "match", expectedSec: 40,
    payload: {
      title: "Colour-coded cloths", prompt: "Match each cloth colour to its area (our colour system).",
      left: [o("r", "Red", "🔴"), o("b", "Blue", "🔵"), o("g", "Green", "🟢"), o("y", "Yellow", "🟡")],
      right: [o("o", "Office desk", "🖥️"), o("w", "Washroom sink", "🚰"), o("t", "Toilet", "🚽"), o("k", "Kitchen", "🍳")],
    },
    key: { value: { r: "t", b: "o", g: "k", y: "w" } },
    followUps: ["Why do cleaners use colour codes?", "Have you used a different colour system before?"],
  },
  {
    id: "cln-dilute", sector: "cleaning", skill: "logical", type: "number", expectedSec: 30,
    payload: {
      title: "Dilution", emoji: "🧴 + 💧", unit: "ml",
      prompt: "Label: 10 ml per 1 litre of water. Your bucket holds 6 litres. How much concentrate?",
    },
    key: { value: 60 },
    followUps: ["How did you work it out?", "What happens if you use too much?"],
  },
  {
    id: "cln-wetfloor", sector: "cleaning", skill: "safety", type: "choice", expectedSec: 15,
    payload: {
      title: "Wet floor", prompt: "You have just mopped a corridor. What do you put out first?", layout: "grid",
      options: [o("a", "Wet-floor sign", "⚠️"), o("b", "Radio", "📻"), o("c", "Laundry basket", "🧺"), o("d", "Broom", "🧹")],
    },
    key: { value: "a" },
    followUps: ["Why is this the first thing?", "What else keeps people safe while you clean?"],
  },
  {
    id: "cln-chemical", sector: "cleaning", skill: "safety", type: "multi", expectedSec: 25,
    payload: {
      title: "Before strong chemicals", prompt: "Select everything you need before using a strong cleaning chemical.",
      options: [o("a", "Gloves", "🧤"), o("b", "Eye protection", "🥽"), o("c", "Read the label", "📄"), o("d", "Sunglasses", "🕶️"), o("e", "Headphones", "🎧")],
    },
    key: { value: ["a", "b", "c"] },
    followUps: ["What do you look for on a label?", "What do you do if a chemical splashes on skin?"],
  },
];

const construction: TaskDef[] = [
  {
    id: "con-ppe", sector: "construction", skill: "safety", type: "multi", expectedSec: 25,
    payload: {
      title: "Welding PPE", prompt: "Select all the protective gear you need for arc welding.",
      options: [o("a", "Welding helmet", "⛑️"), o("b", "Leather gloves", "🧤"), o("c", "Flame-resistant jacket", "🧥"), o("d", "Sandals", "👡"), o("e", "Sunglasses", "🕶️"), o("f", "Safety boots", "🥾")],
    },
    key: { value: ["a", "b", "c", "f"] },
    followUps: ["Why are sunglasses not enough?", "Tell me about a time PPE protected you or a colleague."],
  },
  {
    id: "con-posts", sector: "construction", skill: "logical", type: "number", expectedSec: 45,
    payload: {
      title: "Posts along a wall", emoji: "📏",
      prompt: "A wall is 4.8 m long. You put a post every 60 cm, including both ends. How many posts?",
    },
    key: { value: 9 },
    followUps: ["Walk me through your calculation.", "How would you check it on site?"],
  },
  {
    id: "con-level", sector: "construction", skill: "spatial", type: "choice", expectedSec: 25,
    payload: {
      title: "Spirit level", emoji: "📐", prompt: "The bubble in the spirit level sits left of the centre. Which end is higher?",
      options: [o("a", "Left end", "⬅️"), o("b", "Right end", "➡️"), o("c", "It is level", "⚖️")],
    },
    key: { value: "a" },
    followUps: ["How would you fix it?", "When have you used a level?"],
  },
  {
    id: "con-hotwork", sector: "construction", skill: "safety", type: "order", expectedSec: 35,
    payload: {
      title: "Before welding", prompt: "Put the steps in order before you start welding.",
      options: [o("a", "Strike the arc", "⚡"), o("b", "Put on PPE", "⛑️"), o("c", "Check the area for flammables", "🔍"), o("d", "Extinguisher within reach", "🧯")],
    },
    key: { value: ["c", "d", "b", "a"] },
    followUps: ["What counts as flammable on a site?", "Who do you tell before hot work starts?"],
  },
  {
    id: "con-tools", sector: "construction", skill: "procedural", type: "match", expectedSec: 30,
    payload: {
      title: "Tool for the job", prompt: "Match each tool to its job.",
      left: [o("a", "Hammer", "🔨"), o("b", "Saw"), o("c", "Tape measure", "📏"), o("d", "Wrench", "🔧")],
      right: [o("x", "Cut timber"), o("y", "Bolts"), o("z", "Nails"), o("v", "Measure length")],
    },
    key: { value: { a: "z", b: "x", c: "v", d: "y" } },
    followUps: ["Which tool do you use most?", "How do you check a tool is safe before use?"],
  },
  {
    id: "con-ladder", sector: "construction", skill: "safety", type: "choice", expectedSec: 25,
    payload: {
      title: "Ladder angle", emoji: "🧱", layout: "grid",
      prompt: "A ladder reaches 4 m up a wall. How far from the wall should its foot be?",
      options: [o("a", "0.5 m"), o("b", "1 m"), o("c", "2 m"), o("d", "3 m")],
    },
    key: { value: "b" },
    followUps: ["What rule did you use?", "What else do you check before climbing?"],
  },
];

const logistics: TaskDef[] = [
  {
    id: "log-pallet", sector: "logistics", skill: "safety", type: "choice", expectedSec: 20,
    payload: {
      title: "Safe pallet", prompt: "Which pallet is loaded safely?",
      options: [o("a", "Heavy boxes at the bottom, light on top", "⬇️"), o("b", "Light at the bottom, heavy on top", "⬆️"), o("c", "Boxes hanging over the edge", "↔️"), o("d", "Stacked above the height mark", "📶")],
    },
    key: { value: "a" },
    followUps: ["Why does this matter in a truck?", "What do you do with a pallet that is loaded wrong?"],
  },
  {
    id: "log-route", sector: "logistics", skill: "logical", type: "order", expectedSec: 30,
    payload: {
      title: "Pick route", prompt: "Pick in the shortest walk. Aisles go A → B → C, shelves 1 → 4.",
      options: [o("a", "B2", "📍"), o("b", "A4", "📍"), o("c", "C1", "📍"), o("d", "A1", "📍")],
    },
    key: { value: ["d", "b", "a", "c"] },
    followUps: ["How did you plan the route?", "What changes if an aisle is blocked?"],
  },
  {
    id: "log-count", sector: "logistics", skill: "attention", type: "number", expectedSec: 30,
    payload: {
      title: "Count the boxes", emoji: "📦", unit: "boxes",
      prompt: "A pallet has 4 layers with 6 boxes each. 5 boxes were taken. How many are left?",
    },
    key: { value: 19 },
    followUps: ["How did you count?", "What do you do if the count does not match the system?"],
  },
  {
    id: "log-symbols", sector: "logistics", skill: "attention", type: "match", expectedSec: 30,
    payload: {
      title: "Package symbols", prompt: "Match each package symbol to its meaning.",
      left: [o("a", "Umbrella", "☂️"), o("b", "Glass", "🍷"), o("c", "Arrows", "⬆️")],
      right: [o("y", "Fragile"), o("z", "This way up"), o("x", "Keep dry")],
    },
    key: { value: { a: "x", b: "y", c: "z" } },
    followUps: ["Which symbols have you seen at work?", "How do you handle a fragile parcel in a full van?"],
  },
  {
    id: "log-damage", sector: "logistics", skill: "attention", type: "multi", expectedSec: 25,
    payload: {
      title: "Damaged delivery", prompt: "A delivery arrives. What do you write on the delivery note? Select all.",
      options: [o("a", "Crushed box", "💥"), o("b", "Wet packaging", "💧"), o("c", "Wrong number of boxes", "🔢"), o("d", "Box colour", "🎨"), o("e", "The weather", "🌤️")],
    },
    key: { value: ["a", "b", "c"] },
    followUps: ["Why note it before signing?", "Who do you tell?"],
  },
  {
    id: "log-lift", sector: "logistics", skill: "safety", type: "choice", expectedSec: 15,
    payload: {
      title: "Lifting", prompt: "How do you lift a heavy box?",
      options: [o("a", "Bend knees, back straight, box close", "🦵"), o("b", "Bend at the waist, legs straight", "🙇"), o("c", "Twist while lifting", "🔄"), o("d", "Lift as fast as you can", "⚡")],
    },
    key: { value: "a" },
    followUps: ["When do you ask for help or a lifting aid?", "How heavy is too heavy for one person?"],
  },
];

const it: TaskDef[] = [
  {
    id: "it-loop", sector: "it", skill: "logical", type: "number", expectedSec: 30,
    payload: {
      title: "Read a loop", prompt: "What is x at the end?",
      code: "let x = 0;\nfor (let i = 0; i < 3; i++) {\n  x += 2;\n}",
    },
    key: { value: 6 },
    followUps: ["Explain the code line by line.", "How would you test it?"],
  },
  {
    id: "it-bug", sector: "it", skill: "attention", type: "choice", expectedSec: 40,
    payload: {
      title: "Find the bug", prompt: "Which line has the bug?", layout: "grid",
      code: "1  function average(nums) {\n2    let sum = 0;\n3    for (const n of nums) sum += n;\n4    return sum / nums.lenght;\n5  }",
      options: [o("a", "Line 2"), o("b", "Line 3"), o("c", "Line 4"), o("d", "No bug")],
    },
    key: { value: "c" },
    followUps: ["How did you spot it?", "What tool would catch this automatically?"],
  },
  {
    id: "it-ship", sector: "it", skill: "procedural", type: "order", expectedSec: 30,
    payload: {
      title: "Ship a fix", prompt: "Put the steps for shipping a bug fix in order.",
      options: [o("a", "Deploy", "🚀"), o("b", "Fix the code", "🛠️"), o("c", "Write a failing test", "🧪"), o("d", "Run all tests", "✅")],
    },
    key: { value: ["c", "b", "d", "a"] },
    followUps: ["Why write the test first?", "What do you do if something breaks after deploy?"],
  },
  {
    id: "it-http", sector: "it", skill: "logical", type: "match", expectedSec: 35,
    payload: {
      title: "HTTP status codes", prompt: "Match each status code to its meaning.",
      left: [o("a", "200"), o("b", "404"), o("c", "500"), o("d", "401")],
      right: [o("x", "Not found"), o("y", "Not logged in"), o("z", "OK"), o("v", "Server error")],
    },
    key: { value: { a: "z", b: "x", c: "v", d: "y" } },
    followUps: ["Which code do you see most, and why?", "How would you debug a 500?"],
  },
  {
    id: "it-secrets", sector: "it", skill: "safety", type: "multi", expectedSec: 25,
    payload: {
      title: "Never commit", prompt: "Which should NEVER be committed to git? Select all.",
      options: [o("a", "API keys", "🔑"), o("b", "Passwords", "🔒"), o("c", "README", "📄"), o("d", "Unit tests", "🧪"), o("e", ".env file with secrets", "⚙️")],
    },
    key: { value: ["a", "b", "e"] },
    followUps: ["What do you do if a secret was committed by mistake?", "Where should secrets live instead?"],
  },
];

export const PACKS: Pack[] = [
  { sector: "general", name: "General aptitude", emoji: "🧩", blurb: "Patterns, numbers, space, detail, steps", tasks: general },
  { sector: "cleaning", name: "Cleaning", emoji: "🧽", blurb: "Chemicals, routines, colour codes, safety", tasks: cleaning },
  { sector: "construction", name: "Construction & welding", emoji: "🏗️", blurb: "PPE, measuring, levels, hot work", tasks: construction },
  { sector: "logistics", name: "Logistics", emoji: "📦", blurb: "Loading, picking, counting, symbols", tasks: logistics },
  { sector: "it", name: "IT", emoji: "💻", blurb: "Reading code, debugging, shipping, secrets", tasks: it },
];

export const LIBRARY: TaskDef[] = PACKS.flatMap((p) => p.tasks);

export function libraryTask(id: string): TaskDef | undefined {
  return LIBRARY.find((t) => t.id === id);
}
