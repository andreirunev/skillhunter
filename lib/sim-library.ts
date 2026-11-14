import type { Field, Item, LibraryTask, RoleTemplate } from "./sim.ts";

// Seed content for the job simulation: 4 role templates x 5 duty tasks, plus
// two optional quick_logic tasks. Loaded into task_library / role_templates
// by `npm run db:seed`. Rules for every text: plain English (B1), short,
// culturally neutral, no brands, no real people, no names that point to a
// nationality, synthetic data only. "Good looks like" lists observable
// behaviour, never personality. Emoji only inside task content.

const it = (id: string, text: string): Item => ({ id, text });
const f = (id: string, label: string, value: string): Field => ({ id, label, value });

const TYPICAL_ORDER_NOTE = "The typical order is a guide only, not a right answer.";

export const LIBRARY_TASKS: LibraryTask[] = [
  // Customer support, online electronics shop
  {
    id: "sup-angry", format: "next_step", role_tags: ["support"], default_order: 10,
    title: "Upset customer in chat", duty_hint: "Answer upset customers in chat",
    skill_tag: "Calming an upset customer", skill_kind: "soft", expected_seconds: 40,
    payload: {
      prompt: "A customer writes in the shop chat. What do you reply first?",
      panels: [{ title: "Customer chat", lines: ["💬 My laptop is late AGAIN. I need it for work tomorrow!"] }],
      options: [
        it("a", "Sorry it is late again. I will check the tracking now and write back in 2 minutes."),
        it("b", "Here is your tracking link. It shows the latest status."),
        it("c", "I have told the delivery team. They will email you."),
        it("d", "Here is a discount code for the delay."),
      ],
    },
    key: ["a"], key_kind: "typical",
    good_looks_like: [
      "Acknowledges the problem before explaining anything",
      "Names a concrete next step and when the customer will hear back",
      "Keeps the case themselves instead of passing the customer on",
    ],
    not_measure_note: "This does NOT measure friendliness or personality. There is more than one good reply; in real work they could check the system first.",
    followups: ["Why did you pick this reply first?", "What would you write if the tracking shows no update?", "When would you ask a team lead to step in?"],
  },
  {
    id: "sup-queue", format: "triage", role_tags: ["support"], default_order: 20,
    title: "Morning ticket queue", duty_hint: "Sort the ticket queue",
    skill_tag: "Prioritising tickets", skill_kind: "hard", expected_seconds: 50,
    payload: {
      prompt: "Five new tickets. Tap them in the order you would handle them.",
      items: [
        it("a", "📦 Change my delivery address. The order ships today."),
        it("b", "📱 Does this case fit phone model X?"),
        it("c", "💥 Parcel arrived broken. Third message from this customer."),
        it("d", "🧾 Please send a copy of my invoice."),
        it("e", "🏷️ Partner shop: a price on our site is wrong."),
      ],
    },
    key: ["a", "e", "c", "b", "d"], key_kind: "typical",
    good_looks_like: [
      "Puts the time-critical ticket first (the order that ships today)",
      "Notices problems that affect many customers, such as a wrong price",
      "Gives a reason for each position when asked",
    ],
    not_measure_note: `This does NOT mean a different order is wrong. ${TYPICAL_ORDER_NOTE} Shops have their own rules.`,
    followups: ["Why did you put this one first?", "Which ticket could wait until tomorrow, and why?", "What would you check in the system before answering the broken parcel?"],
  },
  {
    id: "sup-order", format: "spot_error", role_tags: ["support", "warehouse"], default_order: 30,
    title: "Order vs delivery note", duty_hint: "Check orders against delivery notes",
    skill_tag: "Checking documents", skill_kind: "hard", expected_seconds: 45,
    payload: {
      prompt: "Compare the delivery note with the order. Tap every field on the delivery note that does not match.",
      panels: [
        { title: "Order", ref: true, fields: [f("o1", "Order no.", "40718"), f("o2", "Item", "Headphones, black"), f("o3", "Quantity", "2"), f("o4", "Address", "Pine Street 4 B 12")] },
        { title: "Delivery note", fields: [f("d1", "Order no.", "40718"), f("d2", "Item", "Headphones, white"), f("d3", "Quantity", "2"), f("d4", "Address", "Pine Street 4 B 21")] },
      ],
    },
    key: ["d2", "d4"], key_kind: "exact",
    good_looks_like: [
      "Checks every field, not only the first difference",
      "Notices small differences such as swapped digits",
      "Says what to do next, for example stop the parcel before it leaves",
    ],
    not_measure_note: "This does NOT mean the candidate is careless if they missed one. Small text on a phone is harder than a real screen; ask them to look again out loud.",
    followups: ["How did you compare the two documents?", "What would you do if this parcel had already left?", "Who would you tell about the wrong address?"],
  },
  {
    id: "sup-refund", format: "apply_rule", role_tags: ["support"], default_order: 40,
    title: "Refund rules", duty_hint: "Decide refunds using the shop's rules",
    skill_tag: "Applying a policy", skill_kind: "hard", expected_seconds: 40,
    payload: {
      prompt: "Apply the refund rules to this case.",
      rules: [
        "Refund if returned within 30 days of delivery.",
        "The item must be unused, or faulty.",
        "Refunds over 200 € need a team lead's approval.",
      ],
      case: "Delivered 12 days ago. Tablet, 249 €. The screen does not turn on.",
      options: [it("a", "Approve the refund"), it("b", "Decline"), it("c", "Escalate to the team lead")],
    },
    key: "c", key_kind: "exact",
    good_looks_like: [
      "Checks all three rules, not only the first one",
      "Names the rule that decides the case",
      "Knows when a decision is not theirs to make alone",
    ],
    not_measure_note: "This does NOT measure knowledge of consumer law. All rules are on screen; a different answer may come from reading a rule another way.",
    followups: ["Which rule decided it for you?", "What would you tell the customer while the team lead decides?", "What would change if the tablet cost 180 €?"],
  },
  {
    id: "sup-handover", format: "handover", role_tags: ["support"], default_order: 50,
    title: "End-of-shift handover", duty_hint: "Hand over open cases at the end of a shift",
    skill_tag: "Clear handover", skill_kind: "soft", expected_seconds: 35,
    payload: {
      prompt: "Your shift ends. A refund case is still open. Which note do you leave for the next colleague?",
      options: [
        it("a", "Order 40718: waiting for team lead approval (asked 15:10). Customer prefers email. I promised an update by 18:00."),
        it("b", "Refund case still open, see the ticket. Customer is a bit annoyed."),
        it("c", "Please check the tablet refund. I did not finish it."),
      ],
    },
    key: ["a"], key_kind: "typical",
    good_looks_like: [
      "Picks a note with the case number, what is pending and what was promised",
      "Mentions deadlines or promises made to the customer",
      "Can say what the next colleague would otherwise miss",
    ],
    not_measure_note: "This does NOT measure writing skill or English level. The notes are given; the talk is about which information matters.",
    followups: ["What makes this note useful for the next person?", "What else would you add?", "How do you hand over when you are in a hurry?"],
  },

  // Junior developer
  {
    id: "dev-snippet", format: "spot_error", role_tags: ["developer"], default_order: 10,
    title: "Bug in a function", duty_hint: "Find and fix bugs in existing code",
    skill_tag: "Reading code", skill_kind: "hard", expected_seconds: 45,
    payload: {
      prompt: "This function should return the cart total with 24% tax. Tap the line with the bug.",
      panels: [{
        title: "cart.js", mono: true,
        fields: [
          f("l1", "1", "function totalWithTax(items) {"),
          f("l2", "2", "  let sum = 0;"),
          f("l3", "3", "  for (const item of items) {"),
          f("l4", "4", "    sum = item.price * item.qty;"),
          f("l5", "5", "  }"),
          f("l6", "6", "  return sum * 1.24;"),
          f("l7", "7", "}"),
        ],
      }],
    },
    key: ["l4"], key_kind: "exact",
    good_looks_like: [
      "Explains what goes wrong when the cart has two items",
      "Suggests a quick way to prove the bug, such as a small test",
      "Suggests a fix (add to the sum instead of replacing it)",
    ],
    not_measure_note: "This does NOT measure knowledge of one language. Someone from another stack may read the syntax differently; ask them to explain in their own words.",
    followups: ["What happens with two items in the cart?", "How would you write a test that catches this?", "How would you fix it?"],
  },
  {
    id: "dev-logs", format: "read_decide", role_tags: ["developer"], default_order: 20,
    title: "Errors after a release", duty_hint: "Check errors after a release",
    skill_tag: "Reading monitoring data", skill_kind: "hard", expected_seconds: 40,
    payload: {
      prompt: "Errors per hour. A new release went live at 11:00. Most new errors say \"Payment failed\".",
      bars: [{ label: "09:00", value: 3 }, { label: "10:00", value: 4 }, { label: "11:00", value: 38 }, { label: "12:00", value: 41 }],
      unit: "errors",
      question: "What do you check first?",
      options: [
        it("a", "What the 11:00 release changed in payments"),
        it("b", "The server's free disk space"),
        it("c", "The 09:00 errors, because they came first"),
        it("d", "Nothing yet, wait for more data"),
      ],
    },
    key: "a", key_kind: "exact",
    good_looks_like: [
      "Connects the jump in errors with the release time",
      "Names a concrete first check (the change, the logs, a roll-back)",
      "Thinks about users who are affected right now",
    ],
    not_measure_note: "This does NOT measure experience with any monitoring tool. It only shows how they read a simple chart.",
    followups: ["What in the data made you choose this?", "When would you roll back the release?", "Who would you tell, and when?"],
  },
  {
    id: "dev-review", format: "apply_rule", role_tags: ["developer"], default_order: 30,
    title: "Code review checklist", duty_hint: "Review teammates' pull requests",
    skill_tag: "Following a review checklist", skill_kind: "hard", expected_seconds: 35,
    payload: {
      prompt: "Apply the team's review checklist to this pull request.",
      rules: ["Every change needs a test.", "No passwords or keys in the code.", "One approval before merge."],
      case: "Fixes the login bug. Adds a test. Has 1 approval. The config file now contains API_KEY=\"abc123secret\".",
      options: [it("a", "Merge"), it("b", "Request changes"), it("c", "Ask a senior to decide")],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      "Spots the key in the config even though the test and approval are fine",
      "Explains why a secret in the code is a risk",
      "Says what should happen next (remove the key and replace it)",
    ],
    not_measure_note: "This does NOT measure seniority. The checklist is on screen; the point is reading the whole case before deciding.",
    followups: ["Which rule decided it?", "What should happen to the key now that it was pushed?", "How would you word the review comment?"],
  },
  {
    id: "dev-disagree", format: "next_step", role_tags: ["developer"], default_order: 40,
    title: "Teammate disagrees on a PR", duty_hint: "Work through feedback on your code",
    skill_tag: "Handling disagreement", skill_kind: "soft", expected_seconds: 35,
    payload: {
      prompt: "A teammate comments on your pull request: \"This approach is wrong. Rewrite it.\" You think your approach works. What do you do first?",
      options: [
        it("a", "Ask what problem they see and suggest a short call"),
        it("b", "Rewrite it their way to avoid a conflict"),
        it("c", "Reply with the test results that show it works"),
        it("d", "Ask the team lead to decide"),
      ],
    },
    key: null, key_kind: "none",
    good_looks_like: [
      "Asks for the reason before defending their own code",
      "Keeps the discussion about the code, not the person",
      "Proposes a way to decide, such as a call, a small test or a third opinion",
    ],
    not_measure_note: "There is no typical answer here. This does NOT measure confidence or how outspoken someone is; teams handle disagreement in different ways.",
    followups: ["What exactly would you write back?", "When is it fine to just do it their way?", "Tell me about a time you disagreed about how to build something."],
  },
  {
    id: "dev-bugs", format: "triage", role_tags: ["developer"], default_order: 50,
    title: "Which bug first", duty_hint: "Pick which bug to fix next",
    skill_tag: "Prioritising work", skill_kind: "hard", expected_seconds: 45,
    payload: {
      prompt: "Five open bugs and you are the only developer today. Tap them in the order you would work on them.",
      items: [
        it("a", "🔒 Users can see other users' order history"),
        it("b", "🐢 Search on the help page takes 4 seconds"),
        it("c", "💳 Checkout fails for some cards"),
        it("d", "🎨 Wrong button colour in dark mode"),
        it("e", "✏️ Typo in the page footer"),
      ],
    },
    key: ["a", "c", "b", "d", "e"], key_kind: "typical",
    good_looks_like: [
      "Puts data privacy and payment problems first",
      "Gives reasons linked to how many users are affected",
      "Asks what they would need to know before deciding",
    ],
    not_measure_note: `This does NOT mean a different order is wrong. ${TYPICAL_ORDER_NOTE} Ask for their reasons.`,
    followups: ["Why did you put this one first?", "What would you need to know to choose between the top two?", "Which bug would you hand to someone else?"],
  },

  // Warehouse / logistics
  {
    id: "wh-label", format: "spot_error", role_tags: ["warehouse"], default_order: 10,
    title: "Pick list vs shelf label", duty_hint: "Pick items from the right shelf",
    skill_tag: "Checking codes", skill_kind: "hard", expected_seconds: 40,
    payload: {
      prompt: "You are at a shelf. Compare the shelf label with your pick list. Tap every field on the label that does not match.",
      panels: [
        { title: "Pick list", ref: true, fields: [f("p1", "Item code", "77-4120"), f("p2", "Item", "Cable reel 25 m"), f("p3", "Location", "B-14-2")] },
        { title: "Shelf label", fields: [f("s1", "Item code", "77-4210"), f("s2", "Item", "Cable reel 25 m"), f("s3", "Location", "B-14-3")] },
      ],
    },
    key: ["s1", "s3"], key_kind: "exact",
    good_looks_like: [
      "Compares the item code digit by digit",
      "Stops before picking when the location does not match",
      "Says what they would do: find the right shelf or report the label",
    ],
    not_measure_note: "This does NOT mean the candidate is careless if one is missed. Small text on a phone is harder than a real label; ask them to look again.",
    followups: ["What would you do at this shelf?", "How do you check codes quickly when you are busy?", "Who would you tell if a label is wrong?"],
  },
  {
    id: "wh-morning", format: "triage", role_tags: ["warehouse"], default_order: 20,
    title: "Busy morning", duty_hint: "Plan a busy shift",
    skill_tag: "Prioritising work", skill_kind: "hard", expected_seconds: 45,
    payload: {
      prompt: "You are alone for the first hour of the shift. Tap the tasks in the order you would do them.",
      items: [
        it("a", "🚚 The 8:00 truck is at the door, not loaded yet"),
        it("b", "💧 Liquid is leaking from a pallet in aisle C"),
        it("c", "📋 Weekly stock report"),
        it("d", "📦 Unpack yesterday's returns"),
        it("e", "📞 Call a supplier back about next week"),
      ],
    },
    key: ["b", "a", "d", "e", "c"], key_kind: "typical",
    good_looks_like: [
      "Deals with the safety risk first (blocks the area or reports the leak)",
      "Puts the time-critical truck before routine work",
      "Says what they would tell the supervisor",
    ],
    not_measure_note: `This does NOT mean a different order is wrong. ${TYPICAL_ORDER_NOTE} Sites have their own rules.`,
    followups: ["Why did you put this one first?", "What would you do in the first two minutes about the leak?", "Which task could you hand over or move to later?"],
  },
  {
    id: "wh-damaged", format: "apply_rule", role_tags: ["warehouse"], default_order: 30,
    title: "Damaged delivery", duty_hint: "Receive deliveries and note damage",
    skill_tag: "Following a procedure", skill_kind: "hard", expected_seconds: 40,
    payload: {
      prompt: "Apply the receiving rules to this delivery.",
      rules: [
        "Count the boxes before you sign.",
        "Box wet or crushed: write it on the delivery note, then sign.",
        "Refuse only if goods are dangerous or leaking.",
      ],
      case: "10 boxes ordered. All 10 are there. One box is wet at the bottom but not leaking.",
      options: [it("a", "Sign as received OK"), it("b", "Write the damage on the note, then sign"), it("c", "Refuse the whole delivery")],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      "Counts before signing",
      "Writes the damage on the note instead of signing as OK",
      "Knows that refusing is only for dangerous or leaking goods",
    ],
    not_measure_note: "This does NOT measure knowledge of one company's process. The rules are on screen; ask how they read them.",
    followups: ["Which rule decided it?", "What exactly would you write on the delivery note?", "What would you do with the wet box after signing?"],
  },
  {
    id: "wh-stock", format: "read_decide", role_tags: ["warehouse"], default_order: 40,
    title: "Stock check", duty_hint: "Watch stock levels and report shortages",
    skill_tag: "Reading a table", skill_kind: "hard", expected_seconds: 35,
    payload: {
      prompt: "Stock at 7:00 and the orders for today.",
      table: {
        columns: ["Item", "In stock", "Ordered today"],
        rows: [["Tape rolls", "120", "40"], ["Gloves (box)", "15", "22"], ["Pallet wrap", "8", "3"], ["Labels (pack)", "60", "10"]],
      },
      question: "Which item will run out today?",
      options: [it("a", "Tape rolls"), it("b", "Gloves (box)"), it("c", "Pallet wrap"), it("d", "Labels (pack)")],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      "Compares stock with today's orders, not only the smallest number",
      "Says what to do next, such as tell the supervisor or reorder",
      "Checks the result again before acting",
    ],
    not_measure_note: "This does NOT measure maths skill in general. It shows how they read a simple table under light time pressure.",
    followups: ["How did you decide?", "What would you do now that you know?", "Pallet wrap has the smallest number. Why is it not the one?"],
  },
  {
    id: "wh-safety", format: "next_step", role_tags: ["warehouse"], default_order: 50,
    title: "Safety concern", duty_hint: "Speak up about safety",
    skill_tag: "Raising a safety concern", skill_kind: "soft", expected_seconds: 35,
    payload: {
      prompt: "A colleague drives a forklift with the load raised high. People are walking nearby. What do you do?",
      options: [
        it("a", "Signal them to stop, say what you saw, then tell the supervisor"),
        it("b", "Tell the supervisor at the next break"),
        it("c", "Move the people away from the area first"),
        it("d", "Write it in the end-of-shift report"),
      ],
    },
    key: ["a", "c"], key_kind: "typical",
    good_looks_like: [
      "Acts on the risk now, not later",
      "Talks about the behaviour, not the person",
      "Reports it so it gets fixed for everyone",
    ],
    not_measure_note: "This does NOT measure courage or personality. Some workplaces teach people to report first; ask how it worked where they were before.",
    followups: ["What exactly would you say to the driver?", "What if they ignore you?", "Have you raised a safety concern at work before?"],
  },

  // Care assistant (non-clinical: no medical tasks or advice)
  {
    id: "care-visits", format: "triage", role_tags: ["care"], default_order: 10,
    title: "Morning visits", duty_hint: "Plan the morning visits",
    skill_tag: "Planning visits", skill_kind: "hard", expected_seconds: 45,
    payload: {
      prompt: "Your morning in a home-care team. Tap the visits in the order you would do them.",
      items: [
        it("a", "🍽️ Breakfast help for a resident who eats at 8:00"),
        it("b", "🚿 Help with a shower, any time before lunch"),
        it("c", "🛒 Bring groceries before 15:00"),
        it("d", "☎️ A resident calls: they fell and cannot get up, but they are talking"),
        it("e", "🧺 Laundry for a resident, this week"),
      ],
    },
    key: ["d", "a", "b", "c", "e"], key_kind: "typical",
    good_looks_like: [
      "Puts the resident who fell first and mentions getting help",
      "Keeps fixed times in mind (breakfast at 8:00)",
      "Says which visits can move to later",
    ],
    not_measure_note: `This does NOT mean a different order is wrong. ${TYPICAL_ORDER_NOTE} Real teams follow their own procedures.`,
    followups: ["Why did you put this one first?", "Who would you call about the fall?", "How would you let the 8:00 resident know if you are late?"],
  },
  {
    id: "care-chart", format: "spot_error", role_tags: ["care"], default_order: 20,
    title: "Daily chart vs plan", duty_hint: "Keep the daily chart in line with the care plan",
    skill_tag: "Checking records", skill_kind: "hard", expected_seconds: 40,
    payload: {
      prompt: "Compare today's chart with the care plan. Tap every chart entry that does not follow the plan.",
      panels: [
        { title: "Care plan", ref: true, fields: [f("p1", "Breakfast", "8:00"), f("p2", "Walk", "After lunch, 15 min"), f("p3", "Drinks", "At least 6 glasses"), f("p4", "Call to family", "Tuesdays")] },
        { title: "Today's chart (Tuesday)", fields: [f("c1", "Breakfast", "8:00"), f("c2", "Walk", "Skipped"), f("c3", "Drinks", "3 glasses"), f("c4", "Call to family", "Done")] },
      ],
    },
    key: ["c2", "c3"], key_kind: "exact",
    good_looks_like: [
      "Checks each line of the chart against the plan",
      "Notices missing activities, not only wrong numbers",
      "Says who they would tell, such as the shift lead",
    ],
    not_measure_note: "This does NOT measure medical knowledge; no medical decision is asked. It only shows careful reading.",
    followups: ["What would you do about the low number of drinks?", "Who do you tell when the plan was not followed?", "How do you write a chart entry so the next person understands it?"],
  },
  {
    id: "care-visitor", format: "apply_rule", role_tags: ["care"], default_order: 30,
    title: "Visitor policy", duty_hint: "Follow the visitor policy",
    skill_tag: "Applying a policy", skill_kind: "hard", expected_seconds: 40,
    payload: {
      prompt: "Apply the visitor rules to this case.",
      rules: [
        "Visitors sign in at the front desk.",
        "Visits end at 20:00.",
        "Only people on the resident's visitor list may visit.",
      ],
      case: "19:30. A visitor signed in and asks to see a resident. They are not on the visitor list. They say they are a cousin.",
      options: [it("a", "Let them in"), it("b", "Politely say no and tell the shift lead"), it("c", "Let them in for 10 minutes")],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      "Checks all three rules, including the visitor list",
      "Stays polite and explains the rule, not a personal opinion",
      "Involves the shift lead instead of making an exception alone",
    ],
    not_measure_note: "This does NOT measure strictness or kindness as a person. The rules are on screen; ask how they would say it to the visitor.",
    followups: ["Which rule decided it?", "What exactly would you say to the visitor?", "What if the resident says they want to see this person?"],
  },
  {
    id: "care-upset", format: "next_step", role_tags: ["care"], default_order: 40,
    title: "Upset resident", duty_hint: "Support residents who are upset",
    skill_tag: "Listening and calming", skill_kind: "soft", expected_seconds: 35,
    payload: {
      prompt: "A resident says: \"Nobody listens to me! I want to go home.\" Your next visit starts in 10 minutes. What do you do first?",
      options: [
        it("a", "Sit down for a moment, listen and ask what is wrong"),
        it("b", "Say you are busy and will come back later"),
        it("c", "Explain that this is their home now"),
        it("d", "Call a family member right away"),
      ],
    },
    key: ["a"], key_kind: "typical",
    good_looks_like: [
      "Takes a moment to listen before trying to solve",
      "Is honest about time and says when they will come back",
      "Tells the shift lead or the next shift if the feeling continues",
    ],
    not_measure_note: "This does NOT measure warmth or personality. People show care in different ways; ask what they would actually say.",
    followups: ["What would you say in the first minute?", "How do you handle being late for the next visit?", "Who would you tell about this afterwards?"],
  },
  {
    id: "care-handover", format: "handover", role_tags: ["care"], default_order: 50,
    title: "Shift handover", duty_hint: "Hand over to the next shift",
    skill_tag: "Clear handover", skill_kind: "soft", expected_seconds: 35,
    payload: {
      prompt: "End of your shift. Which note do you leave for the evening colleague?",
      options: [
        it("a", "Room 12: drank only 3 glasses today, I offered more. Seemed upset after lunch, calmer after a talk. Family calls at 19:00."),
        it("b", "Room 12: mostly fine. A bit grumpy today."),
        it("c", "Room 12: see the chart."),
      ],
    },
    key: ["a"], key_kind: "typical",
    good_looks_like: [
      "Chooses the note with facts the next person can act on",
      "Mentions times and open items (the 19:00 call)",
      "Describes behaviour neutrally (\"seemed upset\") rather than with labels (\"grumpy\")",
    ],
    not_measure_note: "This does NOT measure writing skill or English level. The notes are given; the talk is about which information matters.",
    followups: ["Why this note?", "What would you add from your own shift?", "How do you describe a resident's mood respectfully?"],
  },

  // Optional abstract tasks (quick_logic), the older format.
  {
    id: "ql-series", format: "quick_logic", role_tags: ["general", "developer", "warehouse"], default_order: 90,
    title: "Number series", duty_hint: "Quick logic warm-up",
    skill_tag: "Pattern reasoning", skill_kind: "hard", expected_seconds: 25,
    payload: { kind: "number", title: "Number series", prompt: "2 → 4 → 8 → 16 → ?", emoji: "🔢" },
    key: { value: 32 }, key_kind: "exact",
    good_looks_like: ["Names the rule in their own words", "Checks the answer by applying the rule again"],
    not_measure_note: "This does NOT measure job skill directly. It is an abstract warm-up; treat it as a conversation starter only.",
    followups: ["What rule did you find?", "How would you double-check your answer?"],
  },
  {
    id: "ql-loop", format: "quick_logic", role_tags: ["developer"], default_order: 91,
    title: "Read a loop", duty_hint: "Quick logic: read code",
    skill_tag: "Reading code", skill_kind: "hard", expected_seconds: 30,
    payload: { kind: "number", title: "Read a loop", prompt: "What is x at the end?", code: "let x = 0;\nfor (let i = 0; i < 3; i++) {\n  x += 2;\n}" },
    key: { value: 6 }, key_kind: "exact",
    good_looks_like: ["Explains the loop line by line", "Suggests how to test it"],
    not_measure_note: "This does NOT measure job skill directly. It shows how they trace simple code; ask them to talk it through.",
    followups: ["Explain the code line by line.", "How would you test it?"],
  },
];

// One duty per task, in the order the candidate meets them.
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    slug: "customer-support", name: "Customer support",
    summary: "Online electronics shop: chat, tickets, orders and refunds.",
    duties: [
      { id: "d1", title: "Answer upset customers in chat", task_id: "sup-angry" },
      { id: "d2", title: "Sort the morning ticket queue", task_id: "sup-queue" },
      { id: "d3", title: "Check orders against delivery notes", task_id: "sup-order" },
      { id: "d4", title: "Decide refunds using the shop's rules", task_id: "sup-refund" },
      { id: "d5", title: "Hand over open cases at the end of a shift", task_id: "sup-handover" },
    ],
  },
  {
    slug: "junior-developer", name: "Junior developer",
    summary: "Small product team: bugs, reviews, monitoring and teamwork.",
    duties: [
      { id: "d1", title: "Find and fix bugs in existing code", task_id: "dev-snippet" },
      { id: "d2", title: "Check errors after a release", task_id: "dev-logs" },
      { id: "d3", title: "Review teammates' pull requests", task_id: "dev-review" },
      { id: "d4", title: "Work through feedback on your code", task_id: "dev-disagree" },
      { id: "d5", title: "Pick which bug to fix next", task_id: "dev-bugs" },
    ],
  },
  {
    slug: "warehouse", name: "Warehouse worker",
    summary: "Picking, receiving deliveries and keeping stock right.",
    duties: [
      { id: "d1", title: "Pick items from the right shelf", task_id: "wh-label" },
      { id: "d2", title: "Plan a busy morning shift", task_id: "wh-morning" },
      { id: "d3", title: "Receive deliveries and note damage", task_id: "wh-damaged" },
      { id: "d4", title: "Watch stock levels and report shortages", task_id: "wh-stock" },
      { id: "d5", title: "Speak up about safety", task_id: "wh-safety" },
    ],
  },
  {
    slug: "care-assistant", name: "Care assistant (non-clinical)",
    summary: "Daily help for residents: visits, routines and handovers. No medical tasks.",
    duties: [
      { id: "d1", title: "Plan the morning visits", task_id: "care-visits" },
      { id: "d2", title: "Keep the daily chart in line with the care plan", task_id: "care-chart" },
      { id: "d3", title: "Follow the visitor policy", task_id: "care-visitor" },
      { id: "d4", title: "Support residents who are upset", task_id: "care-upset" },
      { id: "d5", title: "Hand over to the next shift", task_id: "care-handover" },
    ],
  },
];
