# Accessibility Strategy

LegalLens is built to strictly adhere to WCAG 2.1 AA accessibility guidelines.

## Automated Accessibility Scans (Axe-Core)

We use Playwright combined with `@axe-core/playwright` to automatically scan our core user flows for accessibility violations.

### Axe Scan Evidence

```sh
> npx playwright test tests/e2e/a11y.spec.ts

Running 1 test using 1 worker
  ok 1 [chromium] › tests\e2e\a11y.spec.ts:5:7 › Accessibility (Axe) › Home/Ingest page should not have any automatically detectable accessibility issues (2.4s)
  1 passed (5.6s)
```
*Zero Axe-core violations detected.*

### Lighthouse Scan Evidence

A headless Chrome Lighthouse audit was run against the production build, yielding a perfect accessibility score:

```
Performance Accessibility Best Practices SEO
----------- ------------- -------------- ---
      93.00           100            100 100
```
*Lighthouse Accessibility Score: 100/100.*

## Manual Accessibility Features

1. **Skip Links**: The layout implements a hidden-until-focused `<a href="#main-content">Skip to main content</a>` link at the root layout level, enabling keyboard users to bypass the navigation header.
2. **Reduced Motion**: Respects OS-level reduced motion preferences via `@media (prefers-reduced-motion: reduce)` in `globals.css` (disabling all animations/transitions).
3. **ARIA Landmarks and Labels**: 
   - `aria-live="polite"` is used for dynamic status updates (e.g., when the AI is processing explanations in `ClauseExplorer`).
   - Dialog windows (`role="dialog"`) are properly labeled with `aria-labelledby` pointing to their respective titles.
4. **Keyboard Navigation**: All interactive elements (buttons, inputs) have visible focus indicators utilizing a high-contrast navy outline (`outline: 2px solid var(--navy)`).
