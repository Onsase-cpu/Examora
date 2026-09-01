# Examora

Examora is an examination-management MVP for teachers and academic administrators. It covers examination creation, question-bank management, candidate registers, room and seating readiness, grading queues, published results, and transcript verification.

## Architecture

The browser interface uses React and TypeScript with a focused institutional workspace design: ink navy navigation, parchment surfaces, coral actions, and teal integrity states. Domain rules live in `shared/exam.ts`, the Python batch utility lives in `python/examora_grading.py`, and the existing full-stack scaffold supplies the server and database foundation. The Python module is intentionally deterministic and dependency-free so it can be used for offline imports or future batch result processing.

| Layer | Responsibility |
| --- | --- |
| React + TypeScript | Administrator and teacher examination workspace |
| CSS | Responsive institutional visual system |
| Shared domain module | Grade bands, room utilisation, transcript lines |
| Python utility | Batch scoring and transcript record generation |
| SQL-ready scaffold | Authentication and future persistence boundary |
| Vitest | Grading, score bands, capacity, and transcript tests |

## Run and validate

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
python3 -m py_compile python/examora_grading.py
```

No credential files or exposed API keys are included. The UI is clearly labeled as a workspace and the result/transcript actions are safe MVP simulations. The sample data is deterministic and marked by the product context rather than presented as real institutional records.

## Extension path

A production system can add persistent examination CRUD, CSV candidate imports, invigilator assignments, answer-script uploads, moderation workflows, audit logs, role-based permissions, transcript PDFs, and a dedicated optimization or grading service. The current version keeps the main flows transparent and fast for demonstrations and coursework.
