import type { Field, Item, LibraryTask, Panel, RoleTemplate } from "./sim.ts";

// Seed content for the job simulation: 5 role contests (the most sought-after
// roles at Espoo job fairs), 10 tasks each: 9 scenario questions with exactly
// one correct option (key_kind "exact") and 1 open scenario with no key that
// the recruiter discusses live at the booth. Loaded into task_library /
// role_templates by `npm run db:seed`.
// Rules for every text: plain English, culturally neutral, no brands, no real
// people, synthetic data only. Wrong options are plausible mistakes, never
// jokes. Facts are checked against Finnish practice where it matters (VAT
// 25.5%, emergency number 112, medical helpline 116117, Child Welfare Act
// duty to report, ECEC staff ratio 1:7 for children aged 3+).
// All candidate-facing text lives here, so translations can be added per task
// later without touching components.
// good_looks_like (recruiter only): for questions with a key, the first line
// says why the key is right; for the open scenario, the lines are the rubric.
// Max 5 lines of 200 characters (the builder's limit).

const it = (id: string, text: string): Item => ({ id, text });
const f = (id: string, label: string, value: string): Field => ({ id, label, value });
const code = (title: string, lines: string[]): Panel => ({ title, mono: true, fields: lines.map((v, i) => f(`l${i + 1}`, String(i + 1), v)) });
const why = (text: string) => `Why the key is right: ${text}`;

const OPEN_PROMPT = "There is no single right answer. Pick the start closest to yours; you will explain the rest at the booth.";

export const LIBRARY_TASKS: LibraryTask[] = [
  // Software Developer
  {
    id: "dev-async-foreach", format: "read_decide", role_tags: ["developer"], default_order: 10,
    title: "Async code output", duty_hint: "Read and debug asynchronous code",
    skill_tag: "JavaScript async behaviour", skill_kind: "hard", expected_seconds: 100,
    payload: {
      prompt: "getPrice(id) returns a Promise that resolves to 10.",
      panels: [code("total.js", [
        "async function total(ids) {",
        "  let sum = 0;",
        "  ids.forEach(async (id) => {",
        "    sum += await getPrice(id);",
        "  });",
        "  return sum;",
        "}",
        "total([1, 2, 3]).then(console.log);",
      ])],
      question: "What is logged?",
      options: [it("a", "30"), it("b", "10"), it("c", "0"), it("d", "undefined")],
    },
    key: "c", key_kind: "exact",
    good_looks_like: [
      why("forEach does not wait for async callbacks, so `return sum` runs before any await finishes and the promise resolves to 0."),
      "Explains why, not only the number",
      "Suggests a fix: a for...of loop with await, or Promise.all and a sum",
    ],
    not_measure_note: "This does NOT measure general programming ability. Someone from another language may not know this JavaScript detail; ask how they would find out.",
    followups: ["Walk me through what runs first.", "How would you rewrite it to log 30?", "When would you use Promise.all instead of a loop?"],
  },
  {
    id: "dev-money-float", format: "read_decide", role_tags: ["developer"], default_order: 20,
    title: "Cart total is off", duty_hint: "Handle money and numbers correctly",
    skill_tag: "Number types and money", skill_kind: "hard", expected_seconds: 80,
    payload: {
      prompt: "The shop stores every price as a JavaScript number in euros. A customer reports a wrong total.",
      panels: [code("cart.js", [
        "const total = 0.10 + 0.20;",
        "console.log(total); // 0.30000000000000004",
        "if (total === 0.30) applyDiscount();",
      ])],
      question: "What is the robust fix?",
      options: [
        it("a", "Show the total with toFixed(2) before displaying it"),
        it("b", "Round each price with Math.round() before adding"),
        it("c", "Store and add prices as whole cents (integers) and format only for display"),
        it("d", "Run every price through parseFloat() before adding"),
      ],
    },
    key: "c", key_kind: "exact",
    good_looks_like: [
      why("Binary floating point cannot store 0.1 exactly. Integer cents (or a decimal type) keep sums and comparisons exact; toFixed only hides the error on screen."),
      "Sees that the comparison on line 3 is also broken, not only the display",
      "Mentions where rounding should happen (VAT, discounts) and why",
    ],
    not_measure_note: "This does NOT measure maths skill. It checks one well-known pitfall; ask whether they have met it in another language.",
    followups: ["Why does toFixed(2) not solve it?", "Where in the code would you convert cents to euros?", "How would you round VAT on each line?"],
  },
  {
    id: "dev-sql-left-join", format: "read_decide", role_tags: ["developer"], default_order: 30,
    title: "What does the query return?", duty_hint: "Write and review SQL queries",
    skill_tag: "SQL joins and filters", skill_kind: "hard", expected_seconds: 110,
    payload: {
      prompt: "Customers A, B and C exist. The orders table is below the query.",
      panels: [code("report.sql", [
        "SELECT c.name, COUNT(o.id) AS n",
        "FROM customers c",
        "LEFT JOIN orders o ON o.customer_id = c.id",
        "WHERE o.status = 'paid'",
        "GROUP BY c.name;",
      ])],
      table: { columns: ["Order", "Customer", "Status"], rows: [["101", "A", "paid"], ["102", "A", "refunded"], ["103", "B", "paid"]] },
      question: "What does the query return?",
      options: [
        it("a", "A: 1, B: 1, C: 0"),
        it("b", "A: 1, B: 1 (C is not in the result)"),
        it("c", "A: 2, B: 1, C: 0"),
        it("d", "A: 2, B: 1 (C is not in the result)"),
      ],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      why("C's joined row has status NULL, and the WHERE filter removes it, so the LEFT JOIN acts like an inner join. A's refunded order is filtered out too."),
      "Suggests moving the status condition into the ON clause to keep C with 0",
      "Reads the query step by step instead of guessing",
    ],
    not_measure_note: "This does NOT measure experience with one database product. The behaviour is standard SQL.",
    followups: ["How would you change the query so C shows 0?", "Why is C missing?", "How would you test a report query like this?"],
  },
  {
    id: "dev-race", format: "read_decide", role_tags: ["developer"], default_order: 40,
    title: "Last item in stock", duty_hint: "Make code safe when requests run at the same time",
    skill_tag: "Concurrency", skill_kind: "hard", expected_seconds: 110,
    payload: {
      prompt: "Two customers press Buy for the last item (stock = 1) at the same moment. The server handler:",
      panels: [code("buy.js", [
        "const item = await db.getItem(id);",
        "if (item.stock > 0) {",
        "  await db.setStock(id, item.stock - 1);",
        "  await db.createOrder(id, userId);",
        "}",
      ])],
      question: "What can happen, and what fixes it?",
      options: [
        it("a", "Nothing: Node.js handles one request at a time, so the second request sees stock 0"),
        it("b", "One order and stock -1. Fix: add a database rule that stock cannot go below 0"),
        it("c", "Two orders and stock 0. Fix: read the stock again after line 3 and cancel if it is below 0"),
        it("d", "Two orders and stock 0. Fix: one atomic UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock > 0, and order only if a row changed"),
      ],
    },
    key: "d", key_kind: "exact",
    good_looks_like: [
      why("Both requests can read stock 1 before either writes, so both write 0 and both create orders. Only an atomic check-and-update (or a lock) closes the gap."),
      "Explains that await lets other requests run in between",
      "Mentions doing the stock update and the order in one transaction",
    ],
    not_measure_note: "This does NOT measure knowledge of one framework. Listen for the idea of check-then-act, whatever the words.",
    followups: ["Why does option c still fail?", "How would you test for this bug?", "Where else in a shop can the same problem happen?"],
  },
  {
    id: "dev-access", format: "read_decide", role_tags: ["developer"], default_order: 50,
    title: "Someone else's invoice", duty_hint: "Fix security issues in web APIs",
    skill_tag: "Access control", skill_kind: "hard", expected_seconds: 80,
    payload: {
      prompt: "A tester reports a bug in the invoice API.",
      panels: [{
        title: "Bug report",
        lines: [
          "GET /api/invoices/1043 shows my company's invoice.",
          "I changed the URL to /api/invoices/1044 and saw another company's invoice.",
          "The API checks that the user is logged in.",
        ],
      }],
      question: "What is the right fix?",
      options: [
        it("a", "Use random ids instead of numbers so invoices cannot be guessed"),
        it("b", "On the server, return the invoice only if it belongs to the logged-in user's company"),
        it("c", "Hide the id from the URL by sending it in a POST body"),
        it("d", "Add rate limiting so nobody can try many ids quickly"),
      ],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      why("Being logged in is not permission. The server must check ownership on every request; random ids, POST bodies and rate limits only make the hole harder to find."),
      "Names the problem: broken access control (also called IDOR)",
      "Thinks about the other endpoints that may have the same gap",
    ],
    not_measure_note: "This does NOT measure security certifications or terms. The idea matters more than the name.",
    followups: ["Where in the code would you add the check?", "How would you find other endpoints with the same problem?", "What would you tell the affected customer?"],
  },
  {
    id: "dev-secret", format: "next_step", role_tags: ["developer"], default_order: 60,
    title: "Key pushed to the repository", duty_hint: "Handle secrets and credentials",
    skill_tag: "Security incident response", skill_kind: "hard", expected_seconds: 70,
    payload: {
      prompt: "What do you do first?",
      panels: [{
        title: "10 minutes ago",
        lines: [
          "You pushed a commit that contains the live payment API key.",
          "The repository is private; about 30 people can read it.",
        ],
      }],
      options: [
        it("a", "Rewrite the history and force-push so the commit disappears"),
        it("b", "Delete the line in a new commit"),
        it("c", "Revoke the key and create a new one, then remove it from the code and tell your lead"),
        it("d", "Ask everyone in the team chat not to use the key"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("Once pushed, the key must be treated as leaked: clones and caches keep it. Revoking it is the only step that removes the risk; cleaning the code comes after."),
      "Tells the lead or security contact instead of hiding the mistake",
      "Suggests how to prevent it next time (secret scanning, env variables)",
    ],
    not_measure_note: "This does NOT mean the candidate is careless. Everyone makes mistakes; listen for how they handle it.",
    followups: ["Why is deleting the commit not enough?", "Who would you tell, and how fast?", "How would you stop this happening again?"],
  },
  {
    id: "dev-nplus1", format: "read_decide", role_tags: ["developer"], default_order: 70,
    title: "Slow order history page", duty_hint: "Find and fix performance problems",
    skill_tag: "Database performance", skill_kind: "hard", expected_seconds: 90,
    payload: {
      prompt: "The order history page takes over 2 seconds. Database log for one page load:",
      table: {
        columns: ["Query", "Runs", "Time each"],
        rows: [
          ["SELECT * FROM orders WHERE user_id = 42 LIMIT 50", "1", "8 ms"],
          ["SELECT * FROM products WHERE id = ?", "50", "40 ms"],
        ],
      },
      question: "What is the best first fix?",
      options: [
        it("a", "Add an index on orders.user_id"),
        it("b", "Load the 50 products in one query (WHERE id IN (...) or a JOIN)"),
        it("c", "Put a cache in front of the whole page"),
        it("d", "Make the database connection pool bigger"),
      ],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      why("50 separate product queries take about 2 s of the load (the N+1 problem). One query for all products removes most of it; the orders query is only 8 ms."),
      "Reads the numbers before choosing a fix",
      "Says how they would measure the result after the change",
    ],
    not_measure_note: "This does NOT measure experience with one ORM. Listen for reasoning from the numbers.",
    followups: ["Which number in the log made you choose this?", "When would a cache be the right answer?", "How would you check the fix worked?"],
  },
  {
    id: "dev-rollback", format: "next_step", role_tags: ["developer"], default_order: 80,
    title: "Errors after a Friday release", duty_hint: "Respond to production incidents",
    skill_tag: "Incident judgement", skill_kind: "hard", expected_seconds: 70,
    payload: {
      prompt: "It is Friday 16:25. What do you do first?",
      panels: [{
        title: "Monitoring",
        lines: [
          "16:00 You released version 4.2 (changes to checkout).",
          "16:20 Checkout errors jumped from 0.2% to 9%.",
          "Rollback to 4.1 is one click and was tested last week.",
        ],
      }],
      options: [
        it("a", "Find the bug in the logs and release a hotfix"),
        it("b", "Roll back to 4.1 now, then look for the cause"),
        it("c", "Wait 15 minutes to see if the errors settle"),
        it("d", "Turn checkout off with a maintenance page until Monday"),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("Customers are failing to pay right now and a tested rollback exists. Restoring service first limits the damage; the cause can be found safely afterwards."),
      "Tells the team or on-call what they are doing",
      "Plans how to confirm the rollback fixed the errors",
    ],
    not_measure_note: "This does NOT measure experience with a specific deployment tool.",
    followups: ["Who would you tell, and when?", "When would you not roll back?", "What would you check on Monday?"],
  },
  {
    id: "dev-estimate", format: "next_step", role_tags: ["developer"], default_order: 90,
    title: "Can it ship today?", duty_hint: "Communicate status and estimates",
    skill_tag: "Honest status updates", skill_kind: "soft", expected_seconds: 80,
    payload: {
      prompt: "Which reply do you send first?",
      panels: [
        { title: "Team chat", lines: ["Product manager: Can the export feature go live today? A big customer is asking."] },
        { title: "What you know", lines: ["CSV export works and is tested.", "Excel export still fails its tests: about 2 more days of work."] },
      ],
      options: [
        it("a", "Yes, I'll push it tonight even if I have to stay late."),
        it("b", "It depends on many things. I'll let you know."),
        it("c", "No, the tests are failing."),
        it("d", "Not today. CSV is ready and tested; Excel needs about 2 more days. I can release CSV only today if that helps the customer."),
      ],
    },
    key: ["d"], key_kind: "exact",
    good_looks_like: [
      why("It is honest, gives the real status in plain words, a realistic date, and an option the product manager can act on today."),
      "Does not promise what the tests do not support",
      "Offers a choice instead of only saying no",
    ],
    not_measure_note: "This does NOT measure English writing style. The replies are given; talk about what information matters.",
    followups: ["Why not just say yes?", "What would you do if the manager insists on today?", "How do you give an estimate you are unsure about?"],
  },
  {
    id: "dev-open-legacy", format: "next_step", role_tags: ["developer"], default_order: 100,
    title: "New feature in old payment code", duty_hint: "Plan work in an unfamiliar codebase",
    skill_tag: "Planning under risk", skill_kind: "soft", expected_seconds: 150,
    payload: {
      prompt: OPEN_PROMPT,
      panels: [{
        title: "Situation",
        lines: [
          "You join a team that owns a 6-year-old payment service with almost no tests.",
          "The original authors have left. The service handles about 20,000 € a day.",
          "The business wants a new payment method live in 2 weeks.",
        ],
      }],
      options: [
        it("a", "Write tests around the current payment flow first, then add the new method"),
        it("b", "Build the new method as a separate module behind a feature flag, touching old code as little as possible"),
        it("c", "Spend the first 2 days mapping how payments flow and listing the risks, then plan with the team"),
        it("d", "Tell the business now that 2 weeks is risky and agree on a smaller first release"),
      ],
    },
    key: null, key_kind: "none",
    good_looks_like: [
      "Names the main risk (breaking payments that work today) and how to protect them: tests, a feature flag, a staged rollout",
      "Makes the 2 weeks concrete: what happens in week 1 and in week 2",
      "Talks to people early: the business about scope, the team about reviews",
      "Plans how to watch the release: monitoring, alerts and a way to roll back",
      "Strong answer: combines several steps instead of betting on one move",
    ],
    not_measure_note: "There is no typical answer here. The choice only starts the conversation; score the reasoning about risk, people and time.",
    followups: ["Walk me through your first three days.", "How would you know the release is working?", "What would you say if the business refuses to move the date?"],
  },

  // Practical Nurse (elderly and home care)
  {
    id: "nurse-dosebox", format: "next_step", role_tags: ["nurse"], default_order: 10,
    title: "Extra tablet in the dose box", duty_hint: "Give medicines safely",
    skill_tag: "Medication safety", skill_kind: "hard", expected_seconds: 90,
    payload: {
      prompt: "What do you do first?",
      panels: [{
        title: "Morning home visit",
        lines: [
          "The pharmacy-filled dose box has 5 tablets in the morning slot.",
          "The client's medication list says 4 morning tablets.",
          "The extra tablet is small, white and round.",
        ],
      }],
      options: [
        it("a", "Give the 4 tablets you can match to the list and keep the extra one aside"),
        it("b", "Give nothing from that slot yet; call the nurse in charge to check it against the list"),
        it("c", "Give all 5: the pharmacy filled the box, so it has been checked"),
        it("d", "Ask the client which tablets they usually take and give those"),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("If the slot does not match the list, more than one tablet may be wrong. Hold the dose, check with the nurse in charge, then report it as a medication deviation."),
      "Mentions documenting it and reporting the deviation",
      "Thinks about time-critical medicines while waiting for the answer",
    ],
    not_measure_note: "This does NOT measure knowledge of drug names. The point is the safe order of steps.",
    followups: ["Why not give the 4 tablets you recognise?", "Who else would you inform?", "Where do you record what happened?"],
  },
  {
    id: "nurse-paracetamol", format: "read_decide", role_tags: ["nurse"], default_order: 20,
    title: "More pain medicine?", duty_hint: "Follow medication orders exactly",
    skill_tag: "Dose timing", skill_kind: "hard", expected_seconds: 100,
    payload: {
      prompt: "The client asks for more pain medicine for back pain. It is now 17:00.",
      panels: [
        { title: "Doctor's order", lines: ["Paracetamol 1 g (2 × 500 mg tablets) when needed.", "At least 6 hours between doses.", "At most 3 g in 24 hours."] },
        { title: "Given today", lines: ["07:00 paracetamol 1 g", "13:30 paracetamol 1 g"] },
      ],
      question: "What is correct?",
      options: [
        it("a", "Give 1 g now: the total stays at 3 g"),
        it("b", "Give 500 mg now and 500 mg at 19:30"),
        it("c", "Give 1 g at 19:00, before your shift ends"),
        it("d", "Not before 19:30. Offer other comfort now and tell the nurse if the pain is not controlled"),
      ],
    },
    key: "d", key_kind: "exact",
    good_looks_like: [
      why("13:30 + 6 hours = 19:30. Any dose before then breaks the 6-hour rule, even though the daily total would stay under 3 g."),
      "Checks both rules, not only the daily maximum",
      "Offers non-drug comfort and reports uncontrolled pain",
    ],
    not_measure_note: "This does NOT measure pharmacology knowledge. All the rules are on screen; listen for careful reading.",
    followups: ["How did you work out the time?", "What else could help the pain now?", "When would you ask for the order to be reviewed?"],
  },
  {
    id: "nurse-stroke", format: "next_step", role_tags: ["nurse"], default_order: 30,
    title: "Sudden slurred speech", duty_hint: "Recognise emergencies and act",
    skill_tag: "Emergency recognition", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "What do you do first?",
      panels: [{
        title: "Home visit, 10 minutes ago",
        lines: [
          "During coffee the client's speech suddenly became slurred.",
          "The right corner of the mouth droops and the right hand dropped the cup.",
          "The client says: \"I'm fine, just tired.\"",
        ],
      }],
      options: [
        it("a", "Call 112 now and note the time the symptoms started"),
        it("b", "Help the client to bed and check again in 30 minutes"),
        it("c", "Call the health centre to book a doctor's visit for today"),
        it("d", "Give an aspirin from the cabinet, then call 112"),
      ],
    },
    key: ["a"], key_kind: "exact",
    good_looks_like: [
      why("Sudden face, arm and speech symptoms mean a possible stroke: call 112 at once. The start time decides treatment, and aspirin can harm if it is a bleed."),
      "Knows a check like FAST (face, arm, speech, time)",
      "Stays with the client and keeps them safe until help comes",
    ],
    not_measure_note: "This does NOT measure medical diagnosis. The candidate only needs to recognise an emergency.",
    followups: ["Which signs made you act?", "Why does the start time matter?", "What would you do while waiting for the ambulance?"],
  },
  {
    id: "nurse-hypo", format: "next_step", role_tags: ["nurse"], default_order: 40,
    title: "Low blood sugar", duty_hint: "Support clients with diabetes",
    skill_tag: "Diabetes first aid", skill_kind: "hard", expected_seconds: 80,
    payload: {
      prompt: "What do you do first?",
      panels: [{
        title: "Evening visit",
        lines: [
          "A client with insulin-treated diabetes is sweaty, shaky and a little confused.",
          "They can talk and swallow.",
          "Your meter shows blood glucose 2.9 mmol/L.",
        ],
      }],
      options: [
        it("a", "Give the evening insulin as planned, then a sandwich"),
        it("b", "Serve a full meal with wholegrain bread so the sugar stays up longer"),
        it("c", "Give fast sugar now (juice or glucose tablets) and measure again in 15 minutes"),
        it("d", "Call 112 and give nothing by mouth until help arrives"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("Under 4 mmol/L with symptoms and able to swallow: fast-acting sugar first, then recheck in 15 minutes. Nothing by mouth applies only if they cannot swallow safely."),
      "Plans a snack or meal after the sugar comes back up",
      "Reports it and asks why it happened (dose, meals, illness)",
    ],
    not_measure_note: "This does NOT measure knowledge of diabetes drugs. It checks the first aid step.",
    followups: ["What would you do if it is still low after 15 minutes?", "When would you call 112?", "Who do you tell afterwards?"],
  },
  {
    id: "nurse-norovirus", format: "next_step", role_tags: ["nurse"], default_order: 50,
    title: "Hand hygiene with norovirus", duty_hint: "Prevent infections",
    skill_tag: "Infection control", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "How do you clean your hands before lunch?",
      panels: [{
        title: "Care home",
        lines: [
          "A resident has had vomiting and watery diarrhoea since the night. Norovirus is suspected.",
          "You have just helped them wash, wearing gloves and an apron.",
          "Next you will serve lunch to other residents.",
        ],
      }],
      options: [
        it("a", "Take off gloves and apron, then rub hands with alcohol hand rub"),
        it("b", "Take off gloves and apron, wash hands with soap and water, dry them, then use hand rub"),
        it("c", "Rub the gloves with hand rub and keep them on for lunch"),
        it("d", "Wash with soap and water only if your hands look dirty"),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("Alcohol hand rub alone works poorly against norovirus. Washing with soap and water removes it, and hand rub after that adds protection."),
      "Knows gloves are changed between tasks and never cleaned for reuse",
      "Mentions other steps in an outbreak: separate equipment, cleaning, informing the team",
    ],
    not_measure_note: "This does NOT measure memory of guidelines word for word. Listen for the reason behind each step.",
    followups: ["Why is hand rub alone not enough here?", "What else changes during a norovirus outbreak?", "When do you change gloves?"],
  },
  {
    id: "nurse-dementia", format: "next_step", role_tags: ["nurse"], default_order: 60,
    title: "Wanting to go home", duty_hint: "Care for residents with dementia",
    skill_tag: "Dementia care", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "What do you do first?",
      panels: [{
        title: "17:00 in the care home",
        lines: [
          "A resident with Alzheimer's disease stands at the locked door with a coat on.",
          "They say: \"I must go home now, my children need dinner.\"",
          "Their children are adults and live in another town.",
        ],
      }],
      options: [
        it("a", "Explain calmly that the children are adults and this is home now"),
        it("b", "Take the coat off and lead them back to their room"),
        it("c", "Respond to the feeling: talk about the children and cooking, then walk together to the kitchen"),
        it("d", "Give the as-needed calming medicine on their list"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("Correcting the facts usually raises distress. Meeting the feeling and gently redirecting comes first; medicine only if non-drug ways fail and the plan allows."),
      "Looks for a reason behind the behaviour (time of day, hunger, a habit)",
      "Mentions writing it down so the team can spot patterns",
    ],
    not_measure_note: "This does NOT measure personality or warmth. Listen for a concrete approach.",
    followups: ["Why not tell them the truth?", "What might cause this at 17:00 every day?", "When would medicine be right?"],
  },
  {
    id: "nurse-record", format: "next_step", role_tags: ["nurse"], default_order: 70,
    title: "Write the record entry", duty_hint: "Document care accurately",
    skill_tag: "Documentation", skill_kind: "hard", expected_seconds: 100,
    payload: {
      prompt: "Which entry do you write in the client record?",
      panels: [{
        title: "Morning visit 08:40",
        lines: [
          "The client refused the morning medicines twice, saying \"they make me sick\".",
          "They felt nauseous and ate half of breakfast.",
          "You called the nurse at 08:55; the doctor will review the medicines today.",
        ],
      }],
      options: [
        it("a", "Client difficult and uncooperative this morning, refused medicines."),
        it("b", "Morning went OK except the medicines. Will try again in the evening."),
        it("c", "Refused medicines, seems more confused, probably needs a memory test."),
        it("d", "08:40 Refused morning medicines twice: \"they make me sick\". Nauseous, ate ½ of breakfast. Nurse informed 08:55; doctor to review medicines today."),
      ],
    },
    key: ["d"], key_kind: "exact",
    good_looks_like: [
      why("A good entry is factual and timed, quotes the client, and says who was told and what happens next. No labels and no guesses about diagnoses."),
      "Avoids judging words such as \"difficult\"",
      "Knows the record is read by the next shift and the doctor",
    ],
    not_measure_note: "This does NOT measure English writing skill. The entries are given; talk about what makes a record useful.",
    followups: ["What is wrong with \"difficult\"?", "Who reads this entry next?", "What would you add tonight?"],
  },
  {
    id: "nurse-head-knock", format: "next_step", role_tags: ["nurse"], default_order: 80,
    title: "Head knock on a blood thinner", duty_hint: "Assess risks after falls",
    skill_tag: "Clinical judgement", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Evening visit",
        lines: [
          "The client takes warfarin (a blood thinner).",
          "They slipped an hour ago and hit their head on the door frame.",
          "They feel fine, have a small bump and want to go to bed.",
        ],
      }],
      options: [
        it("a", "Let them sleep and check on them at the morning visit"),
        it("b", "Put an ice pack on the bump, give paracetamol and write it in the record"),
        it("c", "Get medical advice now (nurse in charge or the medical helpline 116117)"),
        it("d", "Ask a relative to wake them every 2 hours tonight"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("On a blood thinner even a small head knock can cause slow bleeding inside the skull, with symptoms hours later. It needs a medical assessment now."),
      "Knows which signs mean calling 112 (drowsiness, vomiting, confusion)",
      "Documents the fall and reports it",
    ],
    not_measure_note: "This does NOT measure knowledge of medicine names. The key fact (a blood thinner) is on screen.",
    followups: ["Why does the blood thinner change things?", "Which signs would make you call 112?", "How would you prevent the next fall?"],
  },
  {
    id: "nurse-relative-call", format: "next_step", role_tags: ["nurse"], default_order: 90,
    title: "A relative wants details", duty_hint: "Talk with relatives and keep confidentiality",
    skill_tag: "Confidentiality under pressure", skill_kind: "soft", expected_seconds: 75,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Phone call",
        lines: [
          "A client's daughter calls, upset: \"Why does my mother have a new medicine? Tell me what the doctor wrote!\"",
          "The client is able to decide for herself and has not given permission to share health information with the daughter.",
        ],
      }],
      options: [
        it("a", "Say you understand the worry, that you cannot share health information without her mother's consent, and offer to ask the mother"),
        it("b", "Tell her the medicine name: she is the closest relative"),
        it("c", "Say you are not allowed to talk to her and end the call"),
        it("d", "Ask her to email the request so you can send a copy of the record"),
      ],
    },
    key: ["a"], key_kind: "exact",
    good_looks_like: [
      why("Health information is confidential. Without the client's consent it cannot be shared, even with close relatives, but the worry can still be met kindly."),
      "Stays calm and friendly while holding the line",
      "Offers a real next step (ask the client, a call from the nurse)",
    ],
    not_measure_note: "This does NOT measure phone manner or accent. The replies are given; talk about why.",
    followups: ["What would you say if she gets angrier?", "When could you share information?", "How do you write this call down?"],
  },
  {
    id: "nurse-open-not-eating", format: "next_step", role_tags: ["nurse"], default_order: 100,
    title: "A client who stopped eating", duty_hint: "Notice changes in a client's condition",
    skill_tag: "Observation and reporting", skill_kind: "soft", expected_seconds: 160,
    payload: {
      prompt: OPEN_PROMPT,
      panels: [{
        title: "Home visit, 15-minute slot",
        lines: [
          "A client who lives alone has left the delivered meals uneaten for 3 days.",
          "They say: \"I'm just not hungry.\" They seem quieter and sadder than last week.",
          "Your next client is waiting and you are already 5 minutes late.",
        ],
      }],
      options: [
        it("a", "Stay longer to talk and check them, and tell the coordinator you will be late"),
        it("b", "Do quick checks (drinking, medicines, pain), then report to the nurse in charge today"),
        it("c", "Ask the client for permission to call a relative about what they have noticed"),
        it("d", "Write a detailed entry and ask for a longer visit tomorrow"),
      ],
    },
    key: null, key_kind: "none",
    good_looks_like: [
      "Sees the possible risks: dehydration, weight loss, low mood or depression, an illness starting",
      "Checks basics safely: fluids, medicines taken, pain, skin, mood; asks open questions",
      "Reports to the nurse in charge the same day and documents what they saw",
      "Respects the client's choices and asks consent before involving relatives",
      "Handles the schedule openly (tells the coordinator) instead of rushing the client",
    ],
    not_measure_note: "There is no typical answer here. The choice only starts the conversation; score how well they notice, check and report.",
    followups: ["What would you check in the first 5 minutes?", "When would this become urgent?", "How would you hand this over?"],
  },

  // Warehouse & Logistics Specialist
  {
    id: "wh-reorder", format: "read_decide", role_tags: ["warehouse"], default_order: 10,
    title: "Time to reorder?", duty_hint: "Keep stock levels right",
    skill_tag: "Inventory maths", skill_kind: "hard", expected_seconds: 100,
    payload: {
      prompt: "Stock data for one item. Reorder point = daily use × lead time + safety stock.",
      table: {
        columns: ["Fact", "Value"],
        rows: [["Average use", "120 units/day"], ["Supplier lead time", "5 days"], ["Safety stock", "200 units"], ["In stock now", "780 units"], ["On order", "0 units"]],
      },
      question: "What do you do?",
      options: [
        it("a", "Wait: 780 units last 6.5 days, longer than the 5-day lead time"),
        it("b", "Order when stock falls to 600 units (5 days of use)"),
        it("c", "Order now: stock is already below the reorder point of 800"),
        it("d", "Order when stock falls to the safety stock of 200"),
      ],
    },
    key: "c", key_kind: "exact",
    good_looks_like: [
      why("120 × 5 + 200 = 800, and 780 is already below it. Waiting means using the safety stock during the lead time."),
      "Explains what safety stock is for (late delivery, a busy week)",
      "Mentions checking for open orders before ordering",
    ],
    not_measure_note: "This does NOT measure speed at mental maths. The formula is on screen; talk through the steps.",
    followups: ["How did you work it out?", "Why keep safety stock at all?", "What would change if the supplier is often late?"],
  },
  {
    id: "wh-fefo", format: "read_decide", role_tags: ["warehouse"], default_order: 20,
    title: "Which pallet first?", duty_hint: "Pick by date rules",
    skill_tag: "FEFO / FIFO", skill_kind: "hard", expected_seconds: 80,
    payload: {
      prompt: "Yoghurt in the cooler. The site rule is FEFO: first expired, first out.",
      table: {
        columns: ["Pallet", "Received", "Best before"],
        rows: [["A", "3 Nov", "20 Nov"], ["B", "5 Nov", "17 Nov"], ["C", "1 Nov", "22 Nov"], ["D", "4 Nov", "19 Nov"]],
      },
      question: "Which pallet do you pick from first?",
      options: [it("a", "Pallet A"), it("b", "Pallet B"), it("c", "Pallet C"), it("d", "Pallet D")],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      why("FEFO goes by the earliest best-before date (B, 17 Nov), not by the earliest arrival (C, which would be FIFO)."),
      "Knows the difference between FEFO and FIFO and when each is used",
      "Mentions what to do with stock close to its date",
    ],
    not_measure_note: "This does NOT measure knowledge of the abbreviations. The rule is explained on screen.",
    followups: ["What is the difference between FIFO and FEFO?", "Which products use FEFO?", "What if pallet B is hard to reach?"],
  },
  {
    id: "wh-receiving", format: "next_step", role_tags: ["warehouse"], default_order: 30,
    title: "Short and damaged delivery", duty_hint: "Receive deliveries and note problems",
    skill_tag: "Receiving", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Unloading",
        lines: [
          "The delivery note says 24 cartons.",
          "You count 23. One of them is wet and crushed at the corner.",
          "The driver is in a hurry and asks you to sign.",
        ],
      }],
      options: [
        it("a", "Sign now and email the supplier about the problems afterwards"),
        it("b", "Before signing, write on the delivery note: 23 received, 1 missing, 1 wet and crushed; take photos"),
        it("c", "Refuse the whole delivery"),
        it("d", "Sign for 24 and correct the stock in the system later"),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("A clean signature says the goods arrived complete and intact. Shortage and damage must be written on the delivery document at handover, or the claim is hard to make."),
      "Stays polite but firm with a driver in a hurry",
      "Knows who to tell next (purchasing, supervisor)",
    ],
    not_measure_note: "This does NOT measure knowledge of transport law. Listen for the order of steps.",
    followups: ["Why write it before signing?", "What would you photograph?", "Who would you tell inside the company?"],
  },
  {
    id: "wh-forklift", format: "next_step", role_tags: ["warehouse"], default_order: 40,
    title: "Load blocks the view", duty_hint: "Drive forklifts safely",
    skill_tag: "Forklift safety", skill_kind: "hard", expected_seconds: 70,
    payload: {
      prompt: "How do you drive to the loading dock?",
      panels: [{
        title: "Forklift",
        lines: [
          "You drive a counterbalance forklift with a tall load.",
          "The load blocks your view forward.",
          "The route crosses a pedestrian walkway.",
        ],
      }],
      options: [
        it("a", "Drive forward slowly and sound the horn at the walkway"),
        it("b", "Lift the load higher so you can see under it"),
        it("c", "Drive forward and lean out of the cab to see past the load"),
        it("d", "Drive in reverse, looking where you are going, with the load low"),
      ],
    },
    key: ["d"], key_kind: "exact",
    good_looks_like: [
      why("When the load blocks the view, travel in reverse facing the direction of travel with the load lowered. Raising it makes the truck unstable."),
      "Mentions stopping and checking at the walkway",
      "Knows when to ask for a second person to guide",
    ],
    not_measure_note: "This does NOT replace a forklift licence check. It only shows safety thinking.",
    followups: ["Why not lift the load higher?", "What do you do at the walkway?", "When would you refuse to move a load?"],
  },
  {
    id: "wh-rack-load", format: "read_decide", role_tags: ["warehouse"], default_order: 50,
    title: "Rack load limit", duty_hint: "Store goods within safe limits",
    skill_tag: "Load calculation", skill_kind: "hard", expected_seconds: 90,
    payload: {
      prompt: "Two pallets should go on the same rack level.",
      panels: [
        { title: "Rack label", lines: ["Max 1,000 kg per beam level, load spread evenly."] },
        { title: "Each pallet", lines: ["30 cartons × 16 kg", "Wooden pallet: 25 kg"] },
      ],
      question: "Can both pallets go on this level?",
      options: [
        it("a", "Yes: 2 × 480 kg = 960 kg"),
        it("b", "Yes: the limit is 1,000 kg per pallet place"),
        it("c", "No: 2 × 505 kg = 1,010 kg, over the limit"),
        it("d", "Yes: 10 kg over is within the safety margin"),
      ],
    },
    key: "c", key_kind: "exact",
    good_looks_like: [
      why("Everything on the beams counts: 30 × 16 kg + 25 kg = 505 kg per pallet, 1,010 kg in total. The label is a maximum, not a guide."),
      "Remembers the pallet's own weight",
      "Suggests a fix: another level or splitting the load",
    ],
    not_measure_note: "This does NOT measure speed at mental maths. Let them talk through it.",
    followups: ["How did you calculate it?", "Where would you put the second pallet?", "What do you do if a beam looks bent?"],
  },
  {
    id: "wh-slotting", format: "read_decide", role_tags: ["warehouse"], default_order: 60,
    title: "Best pick slot", duty_hint: "Plan where items are stored",
    skill_tag: "Slotting", skill_kind: "hard", expected_seconds: 90,
    payload: {
      prompt: "One free slot at waist height next to packing. All four items are light and the same size. Last month:",
      table: {
        columns: ["Item", "Picks", "Units per pick", "Units"],
        rows: [["A", "1,800", "1", "1,800"], ["B", "300", "6", "1,800"], ["C", "900", "1", "900"], ["D", "150", "20", "3,000"]],
      },
      question: "Which item gets the slot to save the most walking and bending?",
      options: [it("a", "Item A"), it("b", "Item B"), it("c", "Item C"), it("d", "Item D")],
    },
    key: "a", key_kind: "exact",
    good_looks_like: [
      why("Walking and bending happen once per pick, not per unit. A has the most picks (1,800); D moves the most units but in only 150 trips."),
      "Separates picks (trips) from units (volume)",
      "Mentions heavy items at waist height for ergonomics",
    ],
    not_measure_note: "This does NOT measure knowledge of slotting software. The data is on screen.",
    followups: ["Why not item D?", "Where would you put heavy items?", "How often would you review the slots?"],
  },
  {
    id: "wh-priorities", format: "read_decide", role_tags: ["warehouse"], default_order: 70,
    title: "Plan the afternoon", duty_hint: "Prioritise work against deadlines",
    skill_tag: "Prioritisation", skill_kind: "hard", expected_seconds: 110,
    payload: {
      prompt: "13:00. You are the only picker in this zone. Open work:",
      table: {
        columns: ["Work", "Time needed", "Deadline"],
        rows: [
          ["Truck 1: 3 orders", "40 min", "Leaves 14:00"],
          ["Customer pickup: 1 order", "10 min", "Customer arrives 13:30"],
          ["Truck 2: 10 orders", "90 min", "Leaves 16:30"],
          ["Put away a delivery", "60 min", "Today"],
        ],
      },
      question: "Which order meets every deadline?",
      options: [
        it("a", "Truck 1 → pickup → Truck 2 → put-away"),
        it("b", "Pickup → Truck 2 → Truck 1 → put-away"),
        it("c", "Put-away → pickup → Truck 1 → Truck 2"),
        it("d", "Pickup → Truck 1 → Truck 2 → put-away"),
      ],
    },
    key: "d", key_kind: "exact",
    good_looks_like: [
      why("Pickup 13:00-13:10, Truck 1 until 13:50 (before 14:00), Truck 2 until 15:20, put-away until 16:20. Every other order makes something late."),
      "Works out the times instead of going by feeling",
      "Says when they would warn the supervisor if a task overruns",
    ],
    not_measure_note: "This does NOT measure speed. Let them show how they worked it out.",
    followups: ["How did you check the times?", "What if Truck 1 picking takes 55 minutes?", "Who would you tell, and when?"],
  },
  {
    id: "wh-cycle-count", format: "next_step", role_tags: ["warehouse"], default_order: 80,
    title: "Count does not match", duty_hint: "Count stock and fix differences",
    skill_tag: "Inventory accuracy", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "What do you do first?",
      panels: [{
        title: "Cycle count, location B-12-03",
        lines: [
          "System: 48 units (4 cartons of 12).",
          "You count 36 units (3 cartons).",
          "Yesterday a delivery of this item was put away in aisle B.",
        ],
      }],
      options: [
        it("a", "Change the system to 36 right away so the stock is correct"),
        it("b", "Leave it: the yearly stocktake will fix it"),
        it("c", "Check nearby locations and open picks for this item, then report the difference"),
        it("d", "Count again tomorrow morning and change it then"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("A gap of exactly one carton often means a misplaced carton or an open pick. Adjusting first can make two locations wrong instead of one."),
      "Looks for the cause before changing numbers",
      "Knows who approves stock adjustments",
    ],
    not_measure_note: "This does NOT measure knowledge of one warehouse system.",
    followups: ["Where would you look first?", "Why not just correct the number?", "What if you do not find the carton?"],
  },
  {
    id: "wh-late-driver", format: "next_step", role_tags: ["warehouse"], default_order: 90,
    title: "Late driver at the gate", duty_hint: "Deal with drivers and partners",
    skill_tag: "Calm communication", skill_kind: "soft", expected_seconds: 75,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Gate",
        lines: [
          "A driver is 2 hours late for the booked slot and wants to unload now.",
          "All 4 doors are busy; 2 trucks that are on time are waiting.",
          "The driver shouts: \"I'll lose my next job because of you!\"",
        ],
      }],
      options: [
        it("a", "Tell the driver to come back tomorrow with a new booking"),
        it("b", "Unload this truck first so the situation calms down"),
        it("c", "Stay calm, acknowledge the stress, explain that on-time trucks go first, and offer the next free door in about 40 minutes"),
        it("d", "Call security right away"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("It lowers the tension without breaking the rule that protects on-time trucks, and gives the driver a real time to plan around."),
      "Keeps their voice calm and does not take it personally",
      "Knows when to involve the supervisor or security",
    ],
    not_measure_note: "This does NOT measure language level. The options are given; talk about why.",
    followups: ["What would you say, word for word?", "When would you call security?", "How do you stay calm when someone shouts?"],
  },
  {
    id: "wh-open-peak", format: "next_step", role_tags: ["warehouse"], default_order: 100,
    title: "Short-staffed peak day", duty_hint: "Lead a shift under pressure",
    skill_tag: "Shift planning", skill_kind: "soft", expected_seconds: 160,
    payload: {
      prompt: OPEN_PROMPT,
      panels: [{
        title: "11:00, peak week",
        lines: [
          "Target: 1,400 order lines shipped by 16:00. Done so far: 500.",
          "Your team has 6 pickers, but 2 called in sick this morning.",
          "Normal pace: about 45 lines per picker per hour.",
        ],
      }],
      options: [
        it("a", "Ask the supervisor now for help from other teams or overtime"),
        it("b", "Re-plan the team: fastest pickers pick, others pack; batch the small orders"),
        it("c", "Sort the remaining orders by truck departure and pick in that order"),
        it("d", "Tell customer service now which orders may miss today's trucks"),
      ],
    },
    key: null, key_kind: "none",
    good_looks_like: [
      "Does the maths: 900 lines in 5 h = 180 lines/h; 4 × 45 = 180, so there is no margin for breaks or problems",
      "Raises the alarm early with numbers, not at 15:30",
      "Protects the most important orders first (truck times, promises to customers)",
      "Keeps safety: no running and no skipped checks to win time",
      "Keeps customer service informed so customers are not surprised",
    ],
    not_measure_note: "There is no typical answer here. The choice only starts the conversation; score the reasoning and the use of the numbers.",
    followups: ["How many lines per hour do you need now?", "Who do you tell first, and what do you say?", "What would you not cut, even under pressure?"],
  },

  // Customer Service & Sales Associate
  {
    id: "cs-shelf-price", format: "read_decide", role_tags: ["retail"], default_order: 10,
    title: "Shelf price vs till price", duty_hint: "Solve price problems at the till",
    skill_tag: "Applying store rules under pressure", skill_kind: "hard", expected_seconds: 80,
    payload: {
      prompt: "A customer at the till shouts that the shelf says 19.90 € but the till shows 24.90 €. You check: an old campaign label is still on the shelf. Five people are queuing.",
      panels: [{ title: "Store rules", lines: ["If the shelf price is lower than the till price, the customer pays the shelf price.", "Wrong labels are fixed the same day."] }],
      question: "What do you do?",
      options: [
        it("a", "Explain that the campaign has ended and the till price is correct"),
        it("b", "Ask the customer to wait aside until the queue is served, then check"),
        it("c", "Apologise, sell at 19.90 €, and ask a colleague to fix the label now"),
        it("d", "Call the supervisor and wait for a decision before going on"),
      ],
    },
    key: "c", key_kind: "exact",
    good_looks_like: [
      why("The store rule already decides the price, so solve it at once: apologise, sell at the shelf price, keep the queue moving and get the label fixed."),
      "Stays calm and does not argue about who is right",
      "Thinks about other shelves with the same old label",
    ],
    not_measure_note: "This does NOT measure consumer law knowledge. The rule is on screen.",
    followups: ["What would you say to the customer?", "Why not call the supervisor?", "What do you do about the label?"],
  },
  {
    id: "cs-vat", format: "read_decide", role_tags: ["retail"], default_order: 20,
    title: "Price without VAT", duty_hint: "Calculate prices and VAT",
    skill_tag: "VAT maths", skill_kind: "hard", expected_seconds: 100,
    payload: {
      prompt: "A business customer asks for the price of a jacket without VAT. The jacket costs 127.50 € including VAT. The Finnish general VAT rate is 25.5%.",
      question: "Which is correct?",
      options: [
        it("a", "94.99 € + VAT 32.51 €"),
        it("b", "101.59 € + VAT 25.91 €"),
        it("c", "102.82 € + VAT 24.68 €"),
        it("d", "101.59 € + VAT 32.51 €"),
      ],
    },
    key: "b", key_kind: "exact",
    good_looks_like: [
      why("Price without VAT = 127.50 / 1.255 = 101.59 €; VAT = 127.50 − 101.59 = 25.91 €. Taking 25.5% of the price with VAT is the common mistake."),
      "Divides by 1.255 instead of subtracting 25.5%",
      "Checks the answer: 101.59 × 1.255 ≈ 127.50",
    ],
    not_measure_note: "This does NOT measure speed at mental maths. A calculator is normal at work; ask how they would check the result.",
    followups: ["How did you calculate it?", "Why is 94.99 € wrong?", "Where does the till show the VAT?"],
  },
  {
    id: "cs-discount", format: "read_decide", role_tags: ["retail"], default_order: 30,
    title: "Two discounts", duty_hint: "Apply campaigns and discounts",
    skill_tag: "Discount maths", skill_kind: "hard", expected_seconds: 90,
    payload: {
      prompt: "Winter coat: 180.00 €. Campaign: −30%. Loyalty members get an extra −10% off the campaign price.",
      question: "What does a loyalty member pay?",
      options: [it("a", "108.00 €"), it("b", "116.00 €"), it("c", "126.00 €"), it("d", "113.40 €")],
    },
    key: "d", key_kind: "exact",
    good_looks_like: [
      why("180.00 × 0.70 = 126.00, then 126.00 × 0.90 = 113.40 €. Discounts applied one after the other do not add up to 40%."),
      "Can explain the difference to a customer in simple words",
      "Checks the till result instead of trusting it blindly",
    ],
    not_measure_note: "This does NOT measure speed at mental maths. Let them talk through it.",
    followups: ["How would you explain the price to the customer?", "Why is it not 108 €?", "What if the till shows a different price?"],
  },
  {
    id: "cs-cash", format: "next_step", role_tags: ["retail"], default_order: 40,
    title: "Paying with a 100 € note", duty_hint: "Handle cash safely",
    skill_tag: "Cash handling", skill_kind: "hard", expected_seconds: 80,
    payload: {
      prompt: "What is the safest way to take the payment?",
      panels: [{ title: "Till", lines: ["The bill is 34.60 €. The customer pays with a 100 € note.", "They are in a hurry and talking on the phone."] }],
      options: [
        it("a", "Say \"100 euros\" aloud, check the note (feel, look, tilt), keep it on the drawer edge until the change is counted back, then put it away"),
        it("b", "Put the note in the drawer and count the change from 34.60 € up to 100 €"),
        it("c", "Check the note under the UV lamp and put it under the drawer tray right away"),
        it("d", "Ask for a smaller note because your change is running low"),
      ],
    },
    key: ["a"], key_kind: "exact",
    good_looks_like: [
      why("Naming the amount and keeping the note visible until the change is given prevents \"I gave you more\" disputes; feel, look and tilt catches most fake notes."),
      "Knows what to do if a note seems fake (keep calm, call the supervisor)",
      "Counts the change back to the customer",
    ],
    not_measure_note: "This does NOT measure experience with one till system.",
    followups: ["Why keep the note out of the drawer?", "How do you check a note?", "What do you do if a customer says they gave you more?"],
  },
  {
    id: "cs-caller-data", format: "next_step", role_tags: ["retail"], default_order: 50,
    title: "Caller asks for account details", duty_hint: "Protect customers' personal data",
    skill_tag: "Data protection", skill_kind: "hard", expected_seconds: 70,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Phone call",
        lines: [
          "A caller says they are a customer and asks for the address and phone number saved on \"their\" account.",
          "They know the name on the account but not the order number or the email address.",
        ],
      }],
      options: [
        it("a", "Read out the saved address so they can check it is right"),
        it("b", "Give the details if the name and home town match"),
        it("c", "Give only the phone number, not the address"),
        it("d", "Share nothing by phone; offer to send the details to the account's email, or ask them to log in"),
      ],
    },
    key: ["d"], key_kind: "exact",
    good_looks_like: [
      why("Personal data may only go to a verified person. A name is easy to know, so the safe route is a channel already linked to the account."),
      "Stays friendly while saying no",
      "Mentions reporting the call if it looks like a scam",
    ],
    not_measure_note: "This does NOT measure knowledge of the GDPR articles. Listen for the idea of checking identity first.",
    followups: ["Why is a name not enough?", "What would you say to a caller who gets angry?", "When would you report the call?"],
  },
  {
    id: "cs-written-reply", format: "next_step", role_tags: ["retail"], default_order: 60,
    title: "Missed delivery reply", duty_hint: "Answer customers in writing",
    skill_tag: "Written replies", skill_kind: "soft", expected_seconds: 100,
    payload: {
      prompt: "Which reply do you send first?",
      panels: [
        { title: "Customer chat", lines: ["My sofa was due on Friday. Nobody came and nobody called. I took a day off for this!"] },
        { title: "What you know", lines: ["The delivery truck broke down.", "The first free delivery time is Tuesday 8-12."] },
      ],
      options: [
        it("a", "Sorry for the inconvenience. Your new delivery date is Tuesday."),
        it("b", "Sorry we missed Friday without calling, after you took a day off. Our truck broke down. The first free time is Tuesday 8-12; if that does not suit you, tell me a better day. I have asked my lead about refunding the delivery fee and will reply by 16:00."),
        it("c", "The delay was caused by our delivery partner. Please contact them directly."),
        it("d", "As our delivery terms say, delays can happen. Your delivery is now on Tuesday."),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("It owns the mistake, gives the reason, offers a concrete time and a choice, and promises a specific follow-up instead of passing the customer on."),
      "Notices the missing phone call is part of the problem",
      "Promises only what they can keep",
    ],
    not_measure_note: "This does NOT measure English writing style. The replies are given; talk about what makes one better.",
    followups: ["What makes this reply better than the short one?", "What would you not promise?", "How would you follow up by 16:00?"],
  },
  {
    id: "cs-warranty", format: "next_step", role_tags: ["retail"], default_order: 70,
    title: "Extended warranty question", duty_hint: "Sell honestly",
    skill_tag: "Honest selling", skill_kind: "hard", expected_seconds: 80,
    payload: {
      prompt: "What do you answer?",
      panels: [{
        title: "Laptop sale",
        lines: [
          "A customer buying a 699 € laptop asks: \"Do I need your 3-year extended warranty? The maker's warranty is only 1 year.\"",
          "Your team is asked to sell more extended warranties this month.",
        ],
      }],
      options: [
        it("a", "Yes: after 1 year any fault is fully the customer's problem"),
        it("b", "Explain honestly: the extended warranty adds cover, but the shop's legal liability for defects does not end when the 1-year warranty ends"),
        it("c", "Yes: an extended warranty is required for laptops over 500 €"),
        it("d", "No: by law every laptop must last at least 3 years"),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("Under Finnish consumer law the seller is liable for defects based on how long such a product should reasonably last, not only during the maker's warranty."),
      "Sells the real benefits of the extra cover without misleading",
      "Accepts a no without pressure",
    ],
    not_measure_note: "This does NOT measure legal knowledge in detail. Listen for honesty under a sales target.",
    followups: ["How would you explain the difference simply?", "What if your manager wants more warranty sales?", "When is an extended warranty really worth it?"],
  },
  {
    id: "cs-giftcard-scam", format: "next_step", role_tags: ["retail"], default_order: 80,
    title: "Gift cards for \"the bank\"", duty_hint: "Protect customers from scams",
    skill_tag: "Judgement with vulnerable customers", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "What do you do first?",
      panels: [{
        title: "Till",
        lines: [
          "An older customer wants to buy 500 € of gift cards and read the codes to someone on the phone.",
          "They look stressed and say: \"The bank's security team told me to do this.\"",
        ],
      }],
      options: [
        it("a", "Sell the cards: it is their money and their decision"),
        it("b", "Gently pause the sale: say real banks never ask for payment in gift cards, and suggest calling their own bank on its official number first"),
        it("c", "Refuse to sell and ask them to leave the shop"),
        it("d", "Call the police right away without talking to the customer"),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("Gift-card payment demanded by \"bank security\" is a known scam. A calm pause and a check through the bank's official number protects the customer without taking over."),
      "Speaks respectfully, without making the customer feel foolish",
      "Knows when to involve the supervisor or the police",
    ],
    not_measure_note: "This does NOT measure knowledge of every scam type. Listen for calm, respectful judgement.",
    followups: ["What would you say, word for word?", "What if they insist on buying?", "When would you call the police?"],
  },
  {
    id: "cs-abuse", format: "next_step", role_tags: ["retail"], default_order: 90,
    title: "Customer starts swearing", duty_hint: "Calm down difficult situations",
    skill_tag: "De-escalation", skill_kind: "soft", expected_seconds: 75,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Service desk",
        lines: [
          "A customer whose return was refused starts swearing at you personally and slams the counter.",
          "A colleague is nearby. No one has been hurt.",
        ],
      }],
      options: [
        it("a", "Raise your voice so you are heard over the shouting"),
        it("b", "Walk away without a word"),
        it("c", "Give the refund so they leave"),
        it("d", "Keep calm and some distance, say you want to help but not while they shout at you, and signal your colleague"),
      ],
    },
    key: ["d"], key_kind: "exact",
    good_looks_like: [
      why("A calm voice, a safe distance and a clear limit lower the tension, and a colleague means you are not alone. Giving in teaches that shouting works."),
      "Knows when to call security or 112 (threats, violence)",
      "Mentions reporting the incident afterwards",
    ],
    not_measure_note: "This does NOT measure confidence or personality. Listen for concrete steps.",
    followups: ["What would you say, word for word?", "When would you call security?", "What do you do after the customer leaves?"],
  },
  {
    id: "cs-open-rush", format: "next_step", role_tags: ["retail"], default_order: 100,
    title: "Three customers, one of you", duty_hint: "Serve several customers at once",
    skill_tag: "Service under pressure", skill_kind: "soft", expected_seconds: 160,
    payload: {
      prompt: OPEN_PROMPT,
      panels: [{
        title: "Saturday, electronics counter",
        lines: [
          "You are alone at the counter for the next 20 minutes.",
          "Customer 1 wants to buy a 1,500 € TV now. Customer 2 is returning a broken phone and getting annoyed.",
          "Customer 3 only has a quick question about a cable.",
        ],
      }],
      options: [
        it("a", "Answer the quick cable question first, then the return, then the TV sale"),
        it("b", "Greet everyone, say the order and the waiting time, then serve them in the order they came"),
        it("c", "Serve the TV customer first, since it is the biggest sale"),
        it("d", "Call a colleague from another department, and start with the annoyed customer"),
      ],
    },
    key: null, key_kind: "none",
    good_looks_like: [
      "Acknowledges every waiting customer right away, even with a word or a look",
      "Explains the plan and the waiting time openly",
      "Uses quick wins fairly without ignoring the customer who is upset",
      "Asks for help early instead of hoping it works out",
      "Keeps the big sale without pressure or rushing",
    ],
    not_measure_note: "There is no typical answer here. The choice only starts the conversation; score how they keep every customer informed and treated fairly.",
    followups: ["What would you say to each customer in the first minute?", "How do you keep the annoyed customer from getting angrier?", "When would you call for help?"],
  },

  // Early Childhood Educator
  {
    id: "ece-safeguarding", format: "next_step", role_tags: ["ece"], default_order: 10,
    title: "Bruises and a child's words", duty_hint: "Protect children (duty to report)",
    skill_tag: "Safeguarding", skill_kind: "hard", expected_seconds: 95,
    payload: {
      prompt: "What is your duty?",
      panels: [{
        title: "Morning",
        lines: [
          "A 5-year-old has finger-shaped bruises on both upper arms.",
          "While playing, the child says: \"Dad squeezed me hard when I spilled milk.\"",
        ],
      }],
      options: [
        it("a", "Ask the parent about the bruises at pick-up before doing anything else"),
        it("b", "Tell the director and let them decide whether to report"),
        it("c", "Make a child welfare notification and a police report today, write down the child's exact words and what you saw, and tell the director"),
        it("d", "Ask the child more questions now to find out exactly what happened"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("The duty to report is personal and without delay: suspected violence goes to child welfare and the police. Staff record what they saw; they do not investigate."),
      "Writes down the child's own words without adding leading questions",
      "Knows the director can help but cannot take over the duty",
      "Does not confront or warn the parent first",
    ],
    not_measure_note: "This does NOT measure knowledge of section numbers. Listen for the duty and the order of steps.",
    followups: ["Why not ask the parent first?", "What exactly would you write down?", "How do you support the child the rest of the day?"],
  },
  {
    id: "ece-anaphylaxis", format: "next_step", role_tags: ["ece"], default_order: 20,
    title: "Allergic reaction at snack time", duty_hint: "Act in allergy emergencies",
    skill_tag: "Anaphylaxis first aid", skill_kind: "hard", expected_seconds: 85,
    payload: {
      prompt: "What do you do first?",
      panels: [{
        title: "Snack time",
        lines: [
          "A 4-year-old with a known peanut allergy ate a cookie brought from home.",
          "Within 5 minutes: hives on the face, swollen lips, coughing and a hoarse voice.",
          "The child's adrenaline auto-injector is in the group's medicine bag.",
        ],
      }],
      options: [
        it("a", "Give the antihistamine from the medicine bag and watch for 15 minutes"),
        it("b", "Inject the adrenaline into the outer thigh now, call 112 and note the time"),
        it("c", "Call the parents first and ask what to do"),
        it("d", "Call 112 and wait for the ambulance before giving any medicine"),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("Skin plus breathing symptoms after a known allergen is anaphylaxis. Adrenaline into the thigh is the first treatment, given at once, and 112 is called."),
      "Knows another adult takes the other children away and calls the parents",
      "Mentions writing down the time and keeping the used injector",
    ],
    not_measure_note: "This does NOT replace first aid training. It checks the first, most urgent step.",
    followups: ["Why adrenaline before the antihistamine?", "What do the other adults do meanwhile?", "What happens after the ambulance arrives?"],
  },
  {
    id: "ece-choking", format: "next_step", role_tags: ["ece"], default_order: 30,
    title: "Choking at lunch", duty_hint: "Give first aid to children",
    skill_tag: "Paediatric first aid", skill_kind: "hard", expected_seconds: 80,
    payload: {
      prompt: "What do you do?",
      panels: [{ title: "Lunch", lines: ["A 3-year-old is choking on a grape.", "The child cannot cough, cry or breathe, but is still conscious."] }],
      options: [
        it("a", "Give the child water to wash the grape down"),
        it("b", "Sweep the mouth with a finger to find the grape"),
        it("c", "Give up to 5 back blows, then up to 5 abdominal thrusts; repeat, and have someone call 112"),
        it("d", "Encourage the child to keep coughing and stay with them"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("With no effective cough, a child over 1 year needs back blows, then abdominal thrusts, at once. A blind finger sweep can push the object deeper."),
      "Knows encouraging coughing is right only while the child can still cough",
      "Knows to start CPR and call 112 if the child becomes unconscious",
    ],
    not_measure_note: "This does NOT replace first aid training. It checks the first step.",
    followups: ["How would it change for a baby under 1?", "What if the child becomes unconscious?", "How do you prevent choking at meals?"],
  },
  {
    id: "ece-conflict", format: "next_step", role_tags: ["ece"], default_order: 40,
    title: "Fight over a toy", duty_hint: "Guide children through conflicts",
    skill_tag: "Conflict guidance", skill_kind: "soft", expected_seconds: 75,
    payload: {
      prompt: "What do you do?",
      panels: [{ title: "Free play", lines: ["Two 4-year-olds grab the same toy truck.", "Both shout \"Mine!\" and one hits the other on the arm."] }],
      options: [
        it("a", "Take the truck away and send both to play somewhere else"),
        it("b", "Stop the hitting calmly at their eye level, check no one is hurt, name both children's feelings and help them agree on a solution"),
        it("c", "Give the truck to the child who had it first"),
        it("d", "Let them sort it out: children learn from conflicts"),
      ],
    },
    key: ["b"], key_kind: "exact",
    good_looks_like: [
      why("Hitting is stopped at once, but the learning comes from an adult guiding both children through feelings to a fair solution, not from the adult deciding."),
      "Gives concrete solution ideas (taking turns, a timer, playing together)",
      "Mentions telling both parents briefly at pick-up",
    ],
    not_measure_note: "This does NOT measure one pedagogy method by name. Listen for what they would actually say.",
    followups: ["What would you say to each child?", "What if it happens every day?", "What do you tell the parents?"],
  },
  {
    id: "ece-observation", format: "next_step", role_tags: ["ece"], default_order: 50,
    title: "Concern about speech", duty_hint: "Observe development and raise concerns",
    skill_tag: "Observation and early support", skill_kind: "hard", expected_seconds: 90,
    payload: {
      prompt: "What is the best next step?",
      panels: [{
        title: "Your observations",
        lines: [
          "A 3½-year-old rarely speaks in group situations.",
          "They use 1-2 word sentences and often do not follow two-step instructions.",
          "The parents have not mentioned any concerns.",
        ],
      }],
      options: [
        it("a", "Tell the parents at pick-up that the child probably has a language disorder"),
        it("b", "Wait until next year: children develop at different speeds"),
        it("c", "Send your notes to the child health clinic so they can assess the child"),
        it("d", "Write down concrete examples for 2-3 weeks, discuss them with the team and the special education teacher, then meet the parents"),
      ],
    },
    key: ["d"], key_kind: "exact",
    good_looks_like: [
      why("Dated observations, the special education teacher, then the parents is the professional route. Staff do not diagnose; sharing with the clinic needs the guardians' consent."),
      "Asks about the languages the child uses at home before judging",
      "Plans how to talk to the parents without alarming them",
    ],
    not_measure_note: "This does NOT measure knowledge of speech disorders. Listen for observing, consulting and involving the family.",
    followups: ["What would you write down?", "How would you open the talk with the parents?", "What could the group do to support the child now?"],
  },
  {
    id: "ece-bite", format: "next_step", role_tags: ["ece"], default_order: 60,
    title: "\"Who bit my child?\"", duty_hint: "Talk with parents in difficult moments",
    skill_tag: "Parent communication", skill_kind: "soft", expected_seconds: 85,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Pick-up",
        lines: ["A parent says angrily: \"My child came home with a bite mark yesterday. Who did it? I want that child's parents' number!\""],
      }],
      options: [
        it("a", "Acknowledge the worry, explain what happened and what you did, say you cannot share other children's information, and offer a follow-up talk"),
        it("b", "Tell them which child it was so the families can sort it out"),
        it("c", "Say biting is normal at this age and nothing can be done"),
        it("d", "Promise the other child will be moved to a different group"),
      ],
    },
    key: ["a"], key_kind: "exact",
    good_looks_like: [
      why("Other children's information is confidential, but the parent still deserves a clear account of what happened, what was done and how it will be prevented."),
      "Stays calm and does not take the anger personally",
      "Promises only what they can keep",
    ],
    not_measure_note: "This does NOT measure language level. The options are given; talk about why.",
    followups: ["What would you say first?", "What could the group do to prevent biting?", "Who else would you tell?"],
  },
  {
    id: "ece-ratio", format: "read_decide", role_tags: ["ece"], default_order: 70,
    title: "Adults for a lake trip", duty_hint: "Plan safe outings",
    skill_tag: "Staffing rules", skill_kind: "hard", expected_seconds: 90,
    payload: {
      prompt: "14 children aged 4-5 are going to the lake shore.",
      panels: [{
        title: "Rules",
        lines: [
          "By law: at least 1 staff member for every 7 children aged 3 or over (full-day care).",
          "Unit rule for trips near water: at least 1 staff member for every 4 children.",
        ],
      }],
      question: "How many staff members must go?",
      options: [it("a", "2"), it("b", "3"), it("c", "4"), it("d", "5")],
    },
    key: "c", key_kind: "exact",
    good_looks_like: [
      why("The stricter rule applies near water: 14 ÷ 4 = 3.5, and you cannot have half an adult, so 4 staff members."),
      "Knows the stricter rule wins",
      "Mentions other trip safety steps: head counts, a first aid kit, a phone",
    ],
    not_measure_note: "This does NOT measure speed at maths. Both rules are on screen.",
    followups: ["How did you work it out?", "What else do you check before a lake trip?", "What if one adult is sick that morning?"],
  },
  {
    id: "ece-special-diet", format: "next_step", role_tags: ["ece"], default_order: 80,
    title: "Special diet portion", duty_hint: "Keep children with allergies safe at meals",
    skill_tag: "Allergy safety", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Lunch",
        lines: [
          "Today's lunch is fish soup. One child has a fish allergy and a special-diet card.",
          "The kitchen sends a portion labelled with the child's name.",
          "It looks and smells exactly like the fish soup.",
        ],
      }],
      options: [
        it("a", "Serve it: the kitchen labelled it for this child"),
        it("b", "Taste a spoonful to check whether it contains fish"),
        it("c", "Don't serve it; check with the kitchen first and give the child something safe meanwhile"),
        it("d", "Ask the child if they think they can eat it"),
      ],
    },
    key: ["c"], key_kind: "exact",
    good_looks_like: [
      why("When a special-diet portion does not look right, it is held until the kitchen confirms. A label is not proof, and tasting or asking the child cannot detect an allergen."),
      "Thinks about how the mix-up happened and how to report it",
      "Keeps the child included at the table while waiting",
    ],
    not_measure_note: "This does NOT measure knowledge of allergies in detail. Listen for the habit of checking.",
    followups: ["Why not taste it?", "How would you report the mix-up?", "How do you keep the child from feeling left out?"],
  },
  {
    id: "ece-photos", format: "next_step", role_tags: ["ece"], default_order: 90,
    title: "Photos by private message", duty_hint: "Keep professional boundaries and privacy",
    skill_tag: "Privacy and boundaries", skill_kind: "hard", expected_seconds: 75,
    payload: {
      prompt: "What do you do?",
      panels: [{
        title: "Message",
        lines: [
          "A parent sends a friend request to your personal social media account.",
          "They also ask you to send today's photos of their child to their phone by a messaging app.",
        ],
      }],
      options: [
        it("a", "Accept and send the photos: the parent gave photo consent"),
        it("b", "Send the photos from your phone but crop out other children"),
        it("c", "Accept the friend request but don't send any photos"),
        it("d", "Politely decline, and share photos only through the daycare's official channel, as the consent allows"),
      ],
    },
    key: ["d"], key_kind: "exact",
    good_looks_like: [
      why("Photos of children are personal data and go only through the employer's channels. Personal accounts and devices blur professional boundaries."),
      "Declines kindly, so the relationship with the parent stays good",
      "Knows to check each child's photo consent",
    ],
    not_measure_note: "This does NOT measure social media habits. Listen for privacy and boundaries.",
    followups: ["How would you word the reply?", "Why not use your own phone?", "What if the parent is a friend outside work?"],
  },
  {
    id: "ece-open-outbursts", format: "next_step", role_tags: ["ece"], default_order: 100,
    title: "Outbursts at transitions", duty_hint: "Support a child with challenging behaviour",
    skill_tag: "Behaviour support", skill_kind: "soft", expected_seconds: 160,
    payload: {
      prompt: OPEN_PROMPT,
      panels: [{
        title: "For two weeks now",
        lines: [
          "A 4-year-old has big outbursts at transitions (going out, coming in for lunch): throwing things, sometimes hitting.",
          "Other children are getting scared.",
          "One parent says: \"At home everything is fine. You must be doing something wrong.\"",
        ],
      }],
      options: [
        it("a", "Observe when and why the outbursts start, then change how transitions work (warnings, pictures, smaller groups)"),
        it("b", "Ask the parents and the special education teacher for a meeting to make a shared plan"),
        it("c", "Give the child one familiar adult and a calm corner for every transition"),
        it("d", "First agree in the team how everyone responds, so the child meets the same approach from all adults"),
      ],
    },
    key: null, key_kind: "none",
    good_looks_like: [
      "Keeps everyone safe first, including the other children",
      "Looks for triggers with dated observations (what happened before, during and after)",
      "Suggests concrete changes to the day, not only rules for the child",
      "Answers the parent without getting defensive: listens, shares observations, plans together",
      "Involves the team and the special education teacher, and writes the plan into the child's ECEC plan",
    ],
    not_measure_note: "There is no typical answer here. The choice only starts the conversation; score the reasoning, safety and teamwork.",
    followups: ["What would you observe, and how?", "What would you say to the parent?", "How would you know the plan is working?"],
  },
];

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    slug: "software-developer", name: "Software Developer",
    summary: "Async code, money maths, SQL, concurrency, access control, secrets, performance, incidents and honest estimates. 9 questions + 1 open scenario.",
    duties: [
      { id: "d1", title: "Read and debug asynchronous code", task_id: "dev-async-foreach" },
      { id: "d2", title: "Handle money and numbers correctly", task_id: "dev-money-float" },
      { id: "d3", title: "Write and review SQL queries", task_id: "dev-sql-left-join" },
      { id: "d4", title: "Make code safe when requests run at the same time", task_id: "dev-race" },
      { id: "d5", title: "Fix security issues in web APIs", task_id: "dev-access" },
      { id: "d6", title: "Handle secrets and credentials", task_id: "dev-secret" },
      { id: "d7", title: "Find and fix performance problems", task_id: "dev-nplus1" },
      { id: "d8", title: "Respond to production incidents", task_id: "dev-rollback" },
      { id: "d9", title: "Communicate status and estimates", task_id: "dev-estimate" },
      { id: "d10", title: "Plan work in an unfamiliar codebase", task_id: "dev-open-legacy" },
    ],
  },
  {
    slug: "practical-nurse", name: "Practical Nurse (elderly and home care)",
    summary: "Medication safety, emergencies, infection control, dementia care, documentation and confidentiality. 9 questions + 1 open scenario.",
    duties: [
      { id: "d1", title: "Give medicines safely", task_id: "nurse-dosebox" },
      { id: "d2", title: "Follow medication orders exactly", task_id: "nurse-paracetamol" },
      { id: "d3", title: "Recognise emergencies and act", task_id: "nurse-stroke" },
      { id: "d4", title: "Support clients with diabetes", task_id: "nurse-hypo" },
      { id: "d5", title: "Prevent infections", task_id: "nurse-norovirus" },
      { id: "d6", title: "Care for residents with dementia", task_id: "nurse-dementia" },
      { id: "d7", title: "Document care accurately", task_id: "nurse-record" },
      { id: "d8", title: "Assess risks after falls", task_id: "nurse-head-knock" },
      { id: "d9", title: "Talk with relatives and keep confidentiality", task_id: "nurse-relative-call" },
      { id: "d10", title: "Notice changes in a client's condition", task_id: "nurse-open-not-eating" },
    ],
  },
  {
    slug: "warehouse-logistics", name: "Warehouse & Logistics Specialist",
    summary: "Reorder maths, date rules, receiving, forklift and rack safety, slotting, deadlines, stock counts and drivers. 9 questions + 1 open scenario.",
    duties: [
      { id: "d1", title: "Keep stock levels right", task_id: "wh-reorder" },
      { id: "d2", title: "Pick by date rules", task_id: "wh-fefo" },
      { id: "d3", title: "Receive deliveries and note problems", task_id: "wh-receiving" },
      { id: "d4", title: "Drive forklifts safely", task_id: "wh-forklift" },
      { id: "d5", title: "Store goods within safe limits", task_id: "wh-rack-load" },
      { id: "d6", title: "Plan where items are stored", task_id: "wh-slotting" },
      { id: "d7", title: "Prioritise work against deadlines", task_id: "wh-priorities" },
      { id: "d8", title: "Count stock and fix differences", task_id: "wh-cycle-count" },
      { id: "d9", title: "Deal with drivers and partners", task_id: "wh-late-driver" },
      { id: "d10", title: "Lead a shift under pressure", task_id: "wh-open-peak" },
    ],
  },
  {
    slug: "customer-service-sales", name: "Customer Service & Sales Associate",
    summary: "Price rules, VAT and discount maths, cash handling, data protection, written replies, honest selling, scams and de-escalation. 9 questions + 1 open scenario.",
    duties: [
      { id: "d1", title: "Solve price problems at the till", task_id: "cs-shelf-price" },
      { id: "d2", title: "Calculate prices and VAT", task_id: "cs-vat" },
      { id: "d3", title: "Apply campaigns and discounts", task_id: "cs-discount" },
      { id: "d4", title: "Handle cash safely", task_id: "cs-cash" },
      { id: "d5", title: "Protect customers' personal data", task_id: "cs-caller-data" },
      { id: "d6", title: "Answer customers in writing", task_id: "cs-written-reply" },
      { id: "d7", title: "Sell honestly", task_id: "cs-warranty" },
      { id: "d8", title: "Protect customers from scams", task_id: "cs-giftcard-scam" },
      { id: "d9", title: "Calm down difficult situations", task_id: "cs-abuse" },
      { id: "d10", title: "Serve several customers at once", task_id: "cs-open-rush" },
    ],
  },
  {
    slug: "early-childhood-educator", name: "Early Childhood Educator",
    summary: "Duty to report, allergy and choking emergencies, conflicts, observation, parent talks, staffing rules and privacy. 9 questions + 1 open scenario.",
    duties: [
      { id: "d1", title: "Protect children (duty to report)", task_id: "ece-safeguarding" },
      { id: "d2", title: "Act in allergy emergencies", task_id: "ece-anaphylaxis" },
      { id: "d3", title: "Give first aid to children", task_id: "ece-choking" },
      { id: "d4", title: "Guide children through conflicts", task_id: "ece-conflict" },
      { id: "d5", title: "Observe development and raise concerns", task_id: "ece-observation" },
      { id: "d6", title: "Talk with parents in difficult moments", task_id: "ece-bite" },
      { id: "d7", title: "Plan safe outings", task_id: "ece-ratio" },
      { id: "d8", title: "Keep children with allergies safe at meals", task_id: "ece-special-diet" },
      { id: "d9", title: "Keep professional boundaries and privacy", task_id: "ece-photos" },
      { id: "d10", title: "Support a child with challenging behaviour", task_id: "ece-open-outbursts" },
    ],
  },
];
