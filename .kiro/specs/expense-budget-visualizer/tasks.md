# Implementation Plan: Expense & Budget Visualizer

## Overview

Fill the gaps between the existing skeleton (`index.html`, `css/style.css`, `js/script.js`) and the full requirements/design by refactoring script.js in-place and patching style.css and index.html. All changes are confined to these three files — no new files or build tools are needed.

## Tasks

- [x] 1. Add constants and refactor state in `js/script.js`
  - [x] 1.1 Replace top-level variable declarations with design constants and state
    - Remove the existing `const form`, `transactionList`, `totalBalance` top-of-file DOM lookups and the bare `let transactions = []` / `let expenseChart` declarations
    - Add `STORAGE_KEY`, `CATEGORIES`, `CATEGORY_COLORS`, `MAX_AMOUNT`, `MAX_NAME_LENGTH` constants as specified in the design
    - Declare `let transactions = []` and `let expenseChart = null` as the sole in-memory state variables
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 2. Implement storage utilities in `js/script.js`
  - [x] 2.1 Implement `isStorageAvailable()`
    - Write a function that attempts a test `setItem` / `getItem` / `removeItem` round-trip on `localStorage` inside a try-catch and returns `true` on success, `false` on any thrown error
    - _Requirements: 7.3_

  - [-] 2.2 Implement `loadTransactions()`
    - Read the raw value from `localStorage` using `STORAGE_KEY`
    - Return `[]` when the value is `null`
    - On `JSON.parse` success, filter entries that are missing any of `{id, itemName, amount, category}` and return the valid array
    - On `SyntaxError`, call `localStorage.removeItem(STORAGE_KEY)` and return `[]`
    - _Requirements: 1.2, 1.3, 1.4_

  - [~] 2.3 Write property test for `loadTransactions()` corruption recovery
    - **Property 7: Corruption Recovery**
    - **Validates: Requirements 1.4**

  - [x] 2.4 Implement `saveTransactions()`
    - Wrap `localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))` in a try-catch
    - On `QuotaExceededError` or `SecurityError`, call `showStorageWarning("save-fail")`
    - _Requirements: 7.1, 7.4_

  - [~] 2.5 Write property test for `saveTransactions()` / storage consistency
    - **Property 2: Storage Consistency**
    - **Validates: Requirements 7.1, 2.3, 4.3**

- [ ] 3. Add storage warning banner to `index.html` and `showStorageWarning()` to `js/script.js`
  - [x] 3.1 Insert `#storage-warning` div into `index.html`
    - Add `<div id="storage-warning" class="storage-warning" hidden>⚠️ Data cannot be saved in this session.</div>` immediately after the `<header>` element and before the `.balance-card` section
    - _Requirements: 7.3, 7.4_

  - [-] 3.2 Implement `showStorageWarning()` in `js/script.js`
    - Write a function that removes the `hidden` attribute from `#storage-warning`
    - _Requirements: 7.3, 7.4_

- [ ] 4. Implement form validation in `js/script.js`
  - [~] 4.1 Implement `validateForm()`
    - At the top of the function, remove all existing `.error-message` `<p>` elements from the form
    - Validate `#item-name`: fail if `.trim().length === 0`; inject `<p class="error-message">Item name is required.</p>` after the input
    - Validate `#amount`: fail if the value is empty, `<= 0`, `> MAX_AMOUNT`, or has more than 2 decimal places; inject the appropriate error `<p>` after the input
    - Validate `#category`: fail if `value === ""`; inject `<p class="error-message">Please select a category.</p>` after the select
    - Return `true` only when all three fields pass
    - _Requirements: 2.6, 2.7, 2.8_

  - [~] 4.2 Write property test for `validateForm()` — validation completeness
    - **Property 5: Validation Completeness**
    - **Validates: Requirements 2.2, 2.6, 2.7, 2.8**

- [ ] 5. Implement render functions in `js/script.js`
  - [~] 5.1 Implement `renderTransactionList()`
    - Clear `#transaction-list` innerHTML
    - If `transactions.length === 0`, inject `<p class="empty-state">No transactions recorded yet.</p>` and return
    - For each transaction (oldest first), create a `.transaction-item` div showing `itemName`, `$amount.toFixed(2)`, `category`, and a delete button with `data-id="${transaction.id}"`
    - _Requirements: 3.1, 3.2, 3.3_

  - [~] 5.2 Implement `updateBalance()`
    - Compute total via `transactions.reduce((sum, t) => sum + t.amount, 0)`
    - Set `#total-balance.textContent = "$" + total.toFixed(2)`
    - _Requirements: 5.1, 5.2, 5.3_

  - [~] 5.3 Write property test for `updateBalance()` — balance accuracy
    - **Property 1: Balance Accuracy**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [~] 5.4 Implement `updateChart()`
    - Destroy any existing `expenseChart` instance
    - Compute per-category totals using `CATEGORY_COLORS` keys
    - Build `filteredLabels`, `filteredData`, `filteredColors` by excluding zero-total categories
    - If `filteredData` is empty, render an empty Chart instance with `plugins.title` set to `"No data to display"` and return
    - Otherwise create a new `Chart` with `type: "pie"`, the filtered labels/data/colors, and `legend: { position: "bottom" }`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.2, 8.3_

  - [~] 5.5 Write property test for `updateChart()` — no phantom segments
    - **Property 3: No Phantom Segments**
    - **Validates: Requirements 6.2, 6.5, 6.6**

  - [~] 5.6 Implement `renderAll()`
    - Write a single function that calls `renderTransactionList()`, `updateBalance()`, `updateChart()` in sequence
    - _Requirements: 1.5, 2.4, 4.4, 5.2, 6.4_

  - [~] 5.7 Write property test for `renderAll()` — idempotent render
    - **Property 6: Idempotent Render**
    - **Validates: Requirements 3.1, 3.3, 6.4**

- [ ] 6. Implement event handlers in `js/script.js`
  - [~] 6.1 Implement `handleFormSubmit(event)`
    - Call `event.preventDefault()`
    - Call `validateForm()`; return early if it returns `false`
    - Build a transaction object: `{ id: crypto.randomUUID(), itemName: itemNameInput.value.trim(), amount: parseFloat(amountInput.value), category: categoryInput.value }`
    - Push to `transactions`, call `saveTransactions()`, `renderAll()`, then `form.reset()`
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [~] 6.2 Implement `deleteTransaction(id)`
    - Filter: `transactions = transactions.filter(t => t.id !== id)`
    - Call `saveTransactions()` then `renderAll()`
    - _Requirements: 4.2, 4.3, 4.4_

  - [~] 6.3 Write property test for `deleteTransaction()` — stable deletion
    - **Property 4: Stable Deletion**
    - **Validates: Requirements 4.2, 4.4**

- [ ] 7. Implement `init()` and wire everything together in `js/script.js`
  - [~] 7.1 Implement `init()` using `DOMContentLoaded`
    - Wrap the entire initialisation block in `document.addEventListener("DOMContentLoaded", function init() { ... })`
    - Call `isStorageAvailable()`; if `false`, call `showStorageWarning("unavailable")`
    - Assign `transactions = loadTransactions()`
    - Attach `handleFormSubmit` to `#transaction-form`'s `submit` event
    - Attach a click event listener on `#transaction-list` that reads `event.target.dataset.id` and calls `deleteTransaction(id)` (event delegation)
    - Call `renderAll()`
    - Remove all previous top-level imperative code from the file (the old `if (savedTransactions)` block, old `form.addEventListener`, old `deleteTransaction` function, etc.)
    - _Requirements: 1.1, 1.5, 7.3_

- [~] 8. Checkpoint — verify JS logic end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add and update CSS rules in `css/style.css`
  - [~] 9.1 Add `.storage-warning` rule
    - Add `.storage-warning { background: #fef3c7; color: #92400e; padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; }` to `style.css`
    - _Requirements: 7.3, 7.4_

  - [~] 9.2 Add `.error-message` rule
    - Add `.error-message { color: crimson; font-size: 13px; margin-top: -10px; margin-bottom: 10px; }` to `style.css`
    - _Requirements: 2.6, 2.7, 2.8_

  - [~] 9.3 Add `.empty-state` rule
    - Add `.empty-state { color: #9ca3af; font-style: italic; text-align: center; margin-top: 20px; }` to `style.css`
    - _Requirements: 3.2, 6.6_

  - [~] 9.4 Add explicit `font-size` and `line-height` to `.transaction-item`
    - Extend the existing `.transaction-item` rule to include `font-size: 14px; line-height: 1.4;`
    - _Requirements: 9.4_

  - [~] 9.5 Add responsive breakpoint for viewports narrower than 600px
    - Add `@media (max-width: 599px) { .bottom-section { grid-template-columns: 1fr; } }` to the end of `style.css`
    - _Requirements: 9.2, 9.5_

- [~] 10. Final checkpoint — verify full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (Properties 1–7 are defined in the design document's "Correctness Properties" section)
- The implementation language is vanilla JavaScript (ES6+) — no build tools or transpilation required
- All changes are confined to three existing files: `index.html`, `css/style.css`, `js/script.js`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.4", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2"] },
    { "id": 3, "tasks": ["2.3", "2.5", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1", "5.2", "5.4"] },
    { "id": 5, "tasks": ["5.3", "5.5", "5.6", "5.7"] },
    { "id": 6, "tasks": ["6.1", "6.2"] },
    { "id": 7, "tasks": ["6.3", "7.1"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] }
  ]
}
```
