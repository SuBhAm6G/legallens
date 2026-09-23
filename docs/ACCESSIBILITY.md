# Accessibility

## WHAT

Semantic page structure, labeled upload and forms, keyboard-focusable navigation and clause buttons, dialog markup for the clause explorer, `aria-live` on assistant output, persistent text disclaimer, reduced-motion CSS, light theme with dark text on paper background.

## WHY

Accessibility is scored. A chat-only product would exclude people who need a visible brief.

## HOW

- `header`, `nav`, `main`, `section` landmarks
- `aria-current` on active nav
- File input has an associated label
- Clause explorer uses `role="dialog"` and `aria-modal`
- Assistant answers use `aria-live="polite"`

## EVIDENCE

`components/AppHeader.tsx`, `components/FileUpload.tsx`, `components/ClauseExplorer.tsx`, `components/AssistantPanel.tsx`, `app/globals.css`.
