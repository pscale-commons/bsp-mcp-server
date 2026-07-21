# 05 — Research Correlates

Three independent bodies of work were searched to test whether the six dimensions (doc 02) are real or invented: **how Claude Code actually structures an instance's context**, **the 2024–2026 context/loop-engineering discourse**, and **the classical philosophical/linguistic universals of orientation**. They converge. The same small set appears three ways — which is the strongest evidence available that it is a floor, not a preference.

Full citations at the foot; short attributed quotes inline.

---

## A. Claude Code — the necessary elements of a real harness

Claude Code is *the harness around the model* — "it provides the tools, context management, and execution environment" — running an explicit loop: **"gather context, take action, and verify results."** What the harness guarantees is in context every turn maps directly onto the six dimensions:

| Claude Code element | always-present? | dimension |
|---|---|---|
| **System-prompt core** — identity + tool-use + formatting + tone + safety, "loaded first," invisible | yes | **STANCE** (identity + way) |
| **Tool definitions & usage guidance** — without them "Claude can only respond with text" | yes | **STANCE** (capability) |
| **Environment block** — cwd, platform, shell, OS, git-repo; git branch/status/commits appended at the very end | yes | **GROUND / SITUATION** (place) |
| **CLAUDE.md** — persistent instructions, "delivered as a user message after the system prompt," loaded in full | yes | **GROUND + INTENTION + SITUATION** (the project's law, aims, state) |
| **Auto memory (MEMORY.md)** — Claude's own cross-session notes, re-injected on compaction | yes | **SITUATION + RELATION** (trajectory, who/what) |
| **Safety / permission framing** — in-prompt safety + enforced permission modes | yes | **STANCE** (way) |
| **The agentic loop** — "gather → act → verify → repeat" | yes (procedure) | — the *engine* the currents feed |
| **User prompt** — "tiny compared to what's already loaded" | per-turn | **GIVEN** |

Two findings matter for the constitution:

1. **The invariant/situational split is already how a harness works.** The system prompt + tools + safety are *constitutive* (loaded first, never shown, surviving compaction); the user prompt is *situational* and "tiny compared to what's already loaded." This is exactly the genus-one system/message seam, and exactly doc 02's constitutive/situational tempo. A real harness *already* front-loads the constitutive currents and treats the task as the small variable — the constitution names *which* currents those must be.

2. **The extension pattern is: name/description always-loaded, body on-demand.** Skills load "name and description at session start; full body loads when invoked"; MCP tool schemas "stay deferred… loaded on demand"; subagents run in a "separate context window" returning "only the final message." This is **the spindle-and-aperture mechanism, already in production** — a shallow always-present pointer, depth dialed on need. Claude Code arrived at the same design pscale makes native. The constitution is the substrate-native, *universal* version of what the harness does ad hoc.

And Anthropic's own name for the practice — **"curating and maintaining the optimal set of tokens (information) during LLM inference"** — is David's "curation of the spindles," almost word for word. The difference is *where the curation lives*: in a harness it is app-engineering; in pscale it is addressable, composable, and therefore *shareable across instances* — the internal API.

> Caveat from the research: token magnitudes cited (system ~4.2K, etc.) are Anthropic's explicitly *illustrative* figures. The *structure* — what loads, when, what survives compaction — is documented fact.

---

## B. Context / loop engineering — the industry converges on a spine

The field's pivot (Karpathy) from prompt- to context-engineering, and Anthropic's 2026 extension into **"loop engineering"**, produced half a dozen "anatomy of context" lists. Deduplicated, every list shares a spine — **instructions · knowledge · tools · memory** — and one governing principle.

| source | the fixed set |
|---|---|
| Phil Schmid (7) | instructions/system · user prompt · state/history · long-term memory · retrieval · tools · output contract |
| LangChain / Lance Martin (3 types) | instructions · knowledge · tools |
| Anthropic "augmented LLM" (3) | retrieval · tools · memory |
| Karpathy | task · few-shot · RAG · multimodal · tools · state/history · compaction |
| Simon Willison (5) | instructions · retrieved knowledge · memory · tool descriptions · prior outputs |
| Anthropic components (~7) | system instructions · tools · examples · message history · MCP · retrieved knowledge · memory |

**The governing principle, stated identically across sources:** the **"smallest possible set of high-signal tokens"** (Anthropic) — "right information, right format, right time" (Schmid) — because the window is finite and degrades when overfilled ("context rot"; 12-Factor's "dumb zone" past ~40% fill). **This is doc 04's fewness rule, arrived at independently by everyone who has built agents at scale.** It is not an aesthetic; it is the empirical constraint.

The industry also names the *operations* (LangChain: **Write · Select · Compress · Isolate**) and the *loop* (**gather → act → verify → repeat**; ReAct's thought→action→observation; Reflexion's act→reflect→retry). And **CoALA's memory typing — semantic / episodic / procedural** — is worth carrying: it is a second, orthogonal typing of currents (facts vs examples vs instructions) that overlaps the four block-forms of doc 03 (procedural≈action, semantic≈content, episodic≈content-as-example).

**But here is the decisive gap the research exposes, and it is the whole opportunity.** Every industry scheme is *functional* — it types context by **what kind of data** it is (instruction / knowledge / tool / memory) and optimises it **per task** ("the right information for the next step"). None is *orientational* — none asks **what conditions of being a situated agent must hold regardless of task**. The industry loads context as **payload for the work**; the current-constitution fixes context as **the invariant of being a coherent agent at all**. That is the difference between context-as-plumbing and context-as-constitution — and it is exactly what David means by the difference between a "wadge of guardrails" (external, per-task, engineered) and "self-contextualising currents" (constitutive, universal, composed). The industry has the plumbing and has explicitly *not* built the constitution, because without addressable substrate semantics there is nothing to compose a *universal* set *from* — each app re-engineers its own. Pscale is the thing that makes the universal version possible. **That is the unbuilt, defensible contribution.**

(This is also the answer to David's "all the concern loops systemically." The industry has *loops* — ReAct, plan-execute, gather-act-verify — but each app builds and tunes its own. Genus-one already unifies its concern loops under one wake architecture over one current bundle. The universal constitution unifies *every* instance's loop over *one* current-set — the loops become systemic because the currents they run on are shared, not re-engineered per app.)

---

## C. The classical universals — the same six, found in antiquity

A search across six frameworks that enumerate the dimensions along which any agent orients to a situation. The result is unambiguous: a **4+2** structure, and the six orientation questions of doc 02 *are* that structure.

**The core tetrad — present in every framework** (the deictic-ontological floor, Bühler's origo plus the demonstrated object — **I · here · now · this-doing**):

- **IDENTITY / who** — Aristotle *Substance* · Kant *substance/inherence* · person-deixis (*I*) · Burke *Agent* · Dasein/embodiment · situation-theory *Individuals*.
- **GROUND / where-world** — Aristotle *Place* · spatial-deixis (*here*) · Burke *Scene* · Heidegger *being-in-the-world*/*clearing*, Gibson *affordances* · Halliday *Field*.
- **SITUATION / when-and-state** — Aristotle *Time*/*Position*/*State* · temporal-deixis (*now*) · Heidegger *thrownness/facticity* · situation-theory *space-time + polarity*.
- **WORK / this-act** — Aristotle *Action*/*Affection* · Burke *Act*/*Agency* · ReAct-style enaction, *ready-to-hand* equipment · situation-theory *infon*, Halliday *Mode*.

**The relational-intentional pair — added only by agency-aware frameworks:**

- **RELATION / with-whom** — appears as a *first-class* dimension only where communication or co-presence is in view: **social deixis**, Halliday's **tenor**, Heidegger's **Mitsein** (being-with). Aristotle and Kant *have* a "relation" category, but it is abstract (relative predicates, causal reciprocity), not "the others I am oriented among." **Burke's pentad and the Five Ws have no distinct with-whom term at all.**
- **INTENTION / toward-what-purpose** — *systematically absent* from the purely descriptive/ontological schemes. Aristotle's ten categories have no purpose (final cause lives elsewhere in his corpus); Kant's theoretical categories exclude it (it belongs to practical reason); deixis has no purpose axis. It appears strongly only where **motive or action is the theory's subject**: Burke's **Purpose**, Halliday's **Field** (purposive activity), and — decisively — Heidegger's **care / for-the-sake-of-which**, where purpose becomes the *organising* dimension, not one among others.

**The finding that matters:** the split between the core four and the added two is *not arbitrary*. **RELATION and INTENTION are precisely the dimensions a framework adds when it takes the agent's engagement — not merely the object's being — as its subject.** Deixis dramatises the same split internally: its original three types (person/place/time = the origo) are the core; **social** and **discourse** deixis are the historically *later* additions (Fillmore, Lyons) — the relational extensions.

This is a strong, independent corroboration of doc 02, and it carries a warning. The two dimensions the classical ontologies *drop* — RELATION and INTENTION — are exactly the two that matter most for an *agent* (as opposed to a *thing*), and exactly the two hardest to keep present. **This session's failure was a RELATION failure.** The tradition predicts it: RELATION is the dimension a merely-descriptive account leaves out, so it is the one an agent-account must most deliberately *build in* as a live current. An LLM trained largely on descriptive text will under-weight precisely RELATION and INTENTION unless the constitution makes them always-present. That is not a footnote; it may be the single most important design consequence in this whole series.

---

## D. What the triangulation establishes

- **The six dimensions are a floor, not a choice.** Antiquity's universals, the modern agent-engineering spine, and a production harness all land on the same small orientation set. The current-constitution is not inventing a taxonomy; it is naming the one that keeps being rediscovered — and making it *always present in the reading*, which is the part everyone else leaves to per-instance engineering.
- **The novelty is the universality, and pscale is what enables it.** Everyone curates context; no one has a *substrate-native, universal, composable* current-set, because without addressable semantics there is nothing to compose it from. This is the defensible, unbuilt contribution — and the fulfilment of the original "first LLM-native tool" claim.
- **RELATION and INTENTION are the currents to guard.** They are the two the descriptive tradition drops, the two an agent most needs, the two hardest to keep live — and the site of this session's proven failure. Whatever else the constitution economises on, it must not economise on making these present.

---

### Primary sources (verified)

**Claude Code / SDK:** how-claude-code-works · context-window · memory · modifying-system-prompts · subagents (code.claude.com/docs) · effective-context-engineering-for-ai-agents · building-effective-agents · writing-tools-for-agents · effective-harnesses-for-long-running-agents (anthropic.com/engineering) · building-agents-with-the-claude-agent-sdk · getting-started-with-loops · steering-claude-code (claude.com/blog).

**Context / loop engineering:** Anthropic (as above) · LangChain "Context Engineering for Agents" + latent.space Lance Martin · philschmid.de/context-engineering · Karpathy (x.com/karpathy/status/1937902205765607626) · simonwillison.net/tags/context-engineering · cognition.com/blog/dont-build-multi-agents · github.com/humanlayer/12-factor-agents · arXiv ReAct 2210.03629 · Reflexion 2303.11366 · Tree-of-Thoughts 2305.10601 · Plan-and-Solve 2305.04091.

**Classical universals:** SEP *Aristotle's Categories* · SEP/Wikipedia *Category (Kant)* · Levinson "Deixis" (MPG) + Bühler origo · Wikipedia *Five Ws* (Hermagoras) · Wikipedia *Dramatistic pentad* (Burke) · Wikipedia *4E cognition* + SEP *Embodied Cognition* (Heidegger/Gibson) · Wikipedia/SEP *Situation semantics* (Barwise & Perry) · Halliday field/tenor/mode.
