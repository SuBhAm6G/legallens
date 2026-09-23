# Testing Strategy

LegalLens maintains rigorous test coverage (149 tests) across its engine and utility layers using Vitest.

## Test Execution Evidence

```sh
> legallens@0.1.0 test
> vitest run

 RUN  v4.1.10 E:/PromptWars/Special Challenge/legallens

 ✓ tests/safety.extended.test.ts (30 tests) 11ms
 ✓ tests/ingestEngine.test.ts (4 tests) 4ms
 ✓ tests/rateLimit.test.ts (12 tests) 29ms
 ✓ tests/ingest.edge.test.ts (14 tests) 6ms
 ✓ tests/diffEngine.test.ts (3 tests) 5ms
 ✓ tests/structureEngine.test.ts (3 tests) 6ms
 ✓ tests/intelligence.test.ts (4 tests) 7ms
 ✓ tests/engines.edge.test.ts (56 tests) 15ms
 ✓ tests/schemas.test.ts (20 tests) 12ms
 ✓ tests/safety.test.ts (3 tests) 5ms

 Test Files  10 passed (10)
      Tests  149 passed (149)
   Start at  21:16:54
   Duration  375ms (transform 631ms, setup 0ms, import 1.18s, tests 100ms, environment 1ms)
```

## Test Architecture

Our tests validate every critical capability:
- **`engines.edge.test.ts` (56 tests):** Validates the logic in metadata extraction, classification, diffing, retrieval, and pipeline orchestration.
- **`safety.extended.test.ts` (30 tests):** Verifies protection against Prompt Injection and prevents restricted language (banned phrases).
- **`schemas.test.ts` (20 tests):** Ensures the LLM outputs match exactly what the frontend requires (Zod integration).
- **`ingest.edge.test.ts` (14 tests):** Tests the file size and type boundaries.
- **`rateLimit.test.ts` (12 tests):** Checks API request limits and IP blocking logic.

## Running Tests Locally
To run the full test suite locally:
```bash
npm run test
```
