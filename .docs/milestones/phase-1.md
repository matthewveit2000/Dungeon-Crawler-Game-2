# Milestone: EPIC 1: Engine Foundation and Application Boot / Phase 1: Repository Scaffolding & CI Integration

> **Backfilled during the Phase 11.5 Hardening Checkpoint.** This phase shipped without a milestone document, and part of it shipped without working. Both are recorded here rather than quietly corrected.

## 1. Executive Summary

The project's foundations were put in place: the tools that build the game, the tools that test it, and the folder structure that keeps the game's technology, its rules, and its content separate as it grows. Nothing is visible to a player yet — this is the workshop, not the game.

## 2. Technical Decisions & Architecture

Vite was chosen as the build tool and development server, PixiJS as the WebGL rendering library, TypeScript in strict mode as the language, and Vitest as the test runner. The three-tier directory structure was created: `src/engine` for Tier 1 (technology), `src/modules` for Tier 2 (game rules), and `src/packs` for Tier 3 (content data).

A GitHub Actions workflow was added at `.github/workflows/jules-ci.yml` to run the checks automatically on every push.

## 3. Lessons Learned

**The CI half of this phase was never delivered, and it took ten more phases to notice.**

The workflow file was committed empty. GitHub cannot parse an empty workflow, so it failed instantly on every push — before installing anything or running a single test. Every one of the 28 workflow runs between this phase and Phase 11 reported failure, and all eleven feature pull requests were merged with a red mark on them.

The damage was not the missing checks themselves. It was that a permanently red signal taught everyone the signal meant nothing. Real regressions then reached `main` and sat there undetected, including a PM audit command that had stopped working two phases earlier and still reported success in the console.

Two rules came out of this, both now in `AGENTS.md`:

- A phase that claims to deliver infrastructure must prove the infrastructure runs, not merely that a file exists.
- A failing check blocks the merge, always. If a check is wrong, fix the check.

The workflow was written properly during Phase 11.5 and now runs formatting, typecheck, the full test suite, a production build, and a guard over the audit toolkit.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the repository on GitHub and click the **Actions** tab.
2. Verify the most recent run shows a green tick, not a red cross.
3. Click into the run and confirm all five steps ran: formatting, typecheck, tests, build, and audit toolkit check.
4. Locally, run `npm install` then `npm run verify`. It should finish with no errors.
5. Run `npm run dev` and open http://localhost:5173 — the game should load with no errors in the browser console.
