# Universal Product Factory Gate Runner v0.1

This directory turns the Product Engine operating standard into machine-readable project state.

## Core files

- `schema/product-manifest.schema.json` - universal manifest contract.
- `projects/critter-flip.json` - first live project manifest.
- `gate-runner.mjs` - validates manifests and prints project, human, automation and release queues.

## State vs control

These are intentionally separate.

**State** answers: has the gate passed?

- `NOT_STARTED`
- `IN_PROGRESS`
- `PASS`
- `BLOCKED`
- `WAIVED`
- `FAILED`

**Control** answers: who is allowed to perform/approve the work?

- `AUTO_ALLOWED` - research, code, tests, packaging, analytics and other safe bounded work may proceed automatically.
- `HUMAN_REVIEW` - factory may prepare the work, but a person must review/accept/revise it.
- `HUMAN_ACTION` - consequential action must be performed/approved by a person.

A gate can therefore be `BLOCKED + HUMAN_ACTION`, `IN_PROGRESS + HUMAN_REVIEW`, or `PASS + AUTO_ALLOWED`.

## Standard stages

| ID | Stage |
|---|---|
| S00 | Discovery Intake |
| S01 | Hostile Market / Legal / Distribution Research |
| S02 | Commercial / Attention Hypothesis |
| S03 | Rights / Provenance |
| S04 | Specification Lock |
| S05 | Story Capture Plan |
| S06 | Pricing / Unit Economics |
| S07 | Production |
| S08 | Automated Verification |
| S09 | Human QA |
| S10 | Derivative Map |
| S11 | Platform Packaging |
| S12 | Compliance Refresh |
| S13 | Release Candidate Verification |
| S14 | Human Release Approval |
| S15 | Deployment / Publication |
| S16 | Live Learning |

All product media use the same stage IDs. Medium-specific work belongs in evidence, blockers, platform adapters and production/test details rather than inventing a new lifecycle.

## Commands

```bash
npm run factory:status
npm run factory:json
npm run factory:validate
```

Direct runner use:

```bash
node factory/gate-runner.mjs factory/projects/critter-flip.json
node factory/gate-runner.mjs factory/projects/critter-flip.json --json
node factory/gate-runner.mjs factory/projects/critter-flip.json --validate-only
node factory/gate-runner.mjs factory/projects/critter-flip.json --require-rc
node factory/gate-runner.mjs factory/projects/critter-flip.json --require-release
```

`--require-rc` fails unless S13 is PASS.

`--require-release` fails unless both S13 Release Candidate Verification and S14 Human Release Approval are PASS.

Normal CI uses only manifest validation. A legitimate human blocker is not a code failure and does not make ordinary CI red.

## Fail-closed rules

- Every required stage S00-S16 must exist exactly once.
- PASS requires evidence.
- BLOCKED requires a blocker.
- Unknown state/control values invalidate the manifest.
- RC and deployment authority are separate.
- A product can have green technical CI while still being commercially blocked.
- Platform compliance must be refreshed before release when the adapter says it is required.
- Derivative products receive their own manifests/release stamps; they do not inherit the source product's release approval.

## Adding another product

Copy the Critter Flip manifest as a structural example, assign a unique project ID, change the medium/platforms/evidence and represent the project's real state. Do not mark gates PASS merely to make the dashboard look complete.

Future factory tooling can consume `--json` output to render dashboards, schedule safe work and expose only the human decisions actually waiting for attention.
