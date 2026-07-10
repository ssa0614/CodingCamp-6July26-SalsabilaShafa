# Design Document — Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page client-side web app built with HTML, CSS, and vanilla JavaScript. It stores all data in `localStorage` and renders a Chart.js pie chart for category-based spending visualisation. No build tools, frameworks, or server are required.

The existing codebase (`index.html`, `css/style.css`, `js/script.js`) already has a working skeleton. This design describes the complete intended architecture so that gaps (missing validation, missing `updateChart()` on load, error handling, empty-state labels, etc.) can be filled in during implementation.

---

## Architecture

### File Structure

```
/
├── index.html          # App shell and DOM structure
├── css/
│   └── style.css       # All visual styling and responsive layout
└── js/
    └── script.js       # All application logic
```

No additional files are needed.

### Technology Decisions

| Concern | Choice | Reason |
|---|---|---|
| Structure | HTML5 | Semantic markup, no build step |
| Styling | CSS3 (custom) | Already in place, sufficient for requirements |
| Logic | Vanilla JS (ES6+) | TC-1 constraint; arrow functions and `const`/`let` are fine for target browsers |
| Chart | Chart.js 4.x via CDN | Already loaded in `index.html`; provides pie chart with legend |
| Persistence | `localStorage` | TC-2 constraint; synchronous, no server needed |

---

## Data Models

### Transaction Object

```js
{
  id: string,          // crypto.randomUUID() — stable identifier for deletion
  itemName: string,    // 1–100 non-whitespace characters
  amount: number,      // positive float, max 2 decimal places, max 1_000_000
  category: string     // one of: "Food" | "Transport" | "Fun"
}
```

The current code uses array index for deletion (`deleteTransaction(index)`). Adding a stable `id` field removes the risk of deleting the wrong item when the array is re-rendered mid-operation.

### In-Memory State

```js
let transactions = [];   // Array<Transaction> — single source of truth
let expenseChart = null; // Chart instance — destroyed and re-created on every update
```

### localStorage Schema

- **Key:** `"transactions"`
- **Value:** JSON-serialised `Array<Transaction>`
- **Written:** after every add or delete
- **Read:** once on page load (`DOMContentLoaded`)

---

## Components and Interfaces

### 1. HTML Structure (`index.html`)

No structural changes needed. The existing layout is:

```
.container (max-width: 900px, centred)
├── <header>          → h1 title
├── #storage-warning  → Warning banner (hidden by default)
├── .balance-card     → Balance_Display  (#total-balance)
├── .form-section     → Transaction_Form (#transaction-form)
│   ├── #item-name    (text input, maxlength="100")
│   ├── #amount       (number input)
│   └── #category     (select: Food / Transport / Fun)
└── .bottom-section   (CSS grid, 2 cols ≥600px)
    ├── .transactions  → Transaction_List (#transaction-list)
    └── .chart-container → Chart (#expenseChart canvas)
```

One addition: a `#storage-warning` banner element placed just inside `.container` (after the header), hidden by default, shown when `localStorage` is unavailable or a write fails.

```html
<div id="storage-warning" class="storage-warning" hidden>
  ⚠️ Data cannot be saved in this session.
</div>
```

### 2. CSS (`style.css`)

Existing styles are largely correct. Changes needed:

| Selector / Rule | Change | Requirement |
|---|---|---|
| `@media (max-width: 599px)` | Add: `.bottom-section { grid-template-columns: 1fr; }` | R9.5 — responsive stacking |
| `.transaction-item` | Ensure `font-size: 14px; line-height: 1.4` (currently inherited from `body` via `Arial` — needs explicit declaration) | R9.4 |
| `.storage-warning` | New rule: yellow banner, `padding: 12px 20px`, `border-radius: 8px`, `background: #fef3c7`, `color: #92400e`, `margin-bottom: 20px` | R7.3, R7.4 |
| `.error-message` | New rule: red inline text under invalid fields, `font-size: 13px`, `color: crimson`, `margin-top: -10px`, `margin-bottom: 10px` | R2.6–R2.8 |
| `.empty-state` | New rule: grey italic centred text for empty list and empty chart states | R3.2, R6.6 |

### 3. JavaScript (`script.js`)

All logic lives in a single file. The module is structured as follows:

```
Constants
State
Storage utilities
  ├── isStorageAvailable() → boolean
  ├── loadTransactions() → Transaction[]
  └── saveTransactions() → void
Render functions
  ├── renderAll() → void
  ├── renderTransactionList() → void
  ├── updateBalance() → void
  └── updateChart() → void
Validation
  └── validateForm() → boolean
Event handlers
  ├── handleFormSubmit(event) → void
  └── deleteTransaction(id: string) → void
Initialisation
  └── init() → void
```

---

## Function Designs

### Constants

```js
const STORAGE_KEY = "transactions";
const CATEGORIES = ["Food", "Transport", "Fun"];
const CATEGORY_COLORS = {
  Food:      "#f97316",  // orange
  Transport: "#3b82f6",  // blue
  Fun:       "#a855f7"   // purple
};
const MAX_AMOUNT = 1_000_000;
const MAX_NAME_LENGTH = 100;
```

Fixed colours satisfy R8.2–R8.3 (unique, consistent per render).

---

### Storage Utilities

#### `isStorageAvailable() → boolean`
Attempts a test write/read/delete on `localStorage`. Returns `false` if any step throws (e.g. private browsing quota = 0). Called once in `init()`.

#### `loadTransactions() → Transaction[]`
```
1. Read raw = localStorage.getItem(STORAGE_KEY)
2. If raw is null → return []
3. Try JSON.parse(raw)
   - On success → validate each item has {id, itemName, amount, category}; filter out malformed entries; return valid array
   - On SyntaxError → localStorage.removeItem(STORAGE_KEY); return []
```

Satisfies R1.2, R1.3, R1.4.

#### `saveTransactions() → void`
```
1. Try localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
2. On QuotaExceededError or SecurityError → showStorageWarning("save-fail")
```

Satisfies R7.1, R7.4.

---

### Validation

#### `validateForm() → boolean`
Called inside the submit handler before creating a Transaction. Clears any existing `.error-message` elements first.

| Field | Rule | Error text |
|---|---|---|
| `#item-name` | `.trim().length > 0` and `≤ 100 chars` | "Item name is required." |
| `#amount` | `> 0`, `≤ 1_000_000`, `≤ 2 decimal places` | "Enter a valid amount (positive, max $1,000,000, 2 decimal places)." |
| `#category` | `value !== ""` | "Please select a category." |

Each error message is injected as a `<p class="error-message">` immediately after the offending input. Returns `true` only when all fields pass.

Satisfies R2.6, R2.7, R2.8.

---

### Render Functions

#### `renderAll() → void`
Calls `renderTransactionList()`, `updateBalance()`, `updateChart()` in sequence. Used on init and after every state mutation.

#### `renderTransactionList() → void`
```
1. Clear #transaction-list innerHTML
2. If transactions.length === 0:
   - Inject <p class="empty-state">No transactions recorded yet.</p>
   - return
3. For each transaction (oldest → newest):
   - Create row HTML with itemName, $amount.toFixed(2), category, delete button
   - Delete button: data-id="${transaction.id}", calls deleteTransaction(id)
```

Uses `transaction.id` (not array index) on the delete button — satisfies stable deletion.
Row font-size 14px / line-height 1.4 set via `.transaction-item` CSS rule.
Satisfies R3.1, R3.2, R3.3.

#### `updateBalance() → void`
```
total = transactions.reduce((sum, t) => sum + t.amount, 0)
#total-balance.textContent = "$" + total.toFixed(2)
```

Satisfies R5.1, R5.3.

#### `updateChart() → void`
```
1. If expenseChart exists → expenseChart.destroy(); expenseChart = null
2. Compute totals per category using CATEGORY_COLORS keys
3. Build filteredLabels / filteredData / filteredColors by excluding zero-total categories
4. If filteredData is empty:
   - Render Chart with empty datasets + plugins.title "No data to display"
   - return
5. Create new Chart(ctx, { type: "pie", data: { labels, datasets: [{ data, backgroundColor }] },
     options: { plugins: { legend: { position: "bottom" } } } })
```

Satisfies R6.1–R6.6, R8.2, R8.3.

---

### Event Handlers

#### `handleFormSubmit(event) → void`
```
1. event.preventDefault()
2. If !validateForm() → return
3. Build transaction = { id: crypto.randomUUID(), itemName: trim, amount: parseFloat, category }
4. transactions.push(transaction)
5. saveTransactions()
6. renderAll()
7. form.reset()
```

Satisfies R2.2–R2.5.

#### `deleteTransaction(id) → void`
```
1. transactions = transactions.filter(t => t.id !== id)
2. saveTransactions()
3. renderAll()
```

Satisfies R4.2–R4.4. No confirmation dialog (R4.2).

---

### Initialisation

#### `init() → void`
Runs on `DOMContentLoaded`.

```
1. if (!isStorageAvailable()) → showStorageWarning("unavailable"); proceed without saving
2. transactions = loadTransactions()
3. Attach submit handler to #transaction-form
4. Attach click delegation to #transaction-list for delete buttons
5. renderAll()
```

Satisfies R1.1–R1.5, R7.3.

---

## UI Layout

```
┌─────────────────────────────────────────────────┐
│           Expense & Budget Visualizer            │  ← h1
├─────────────────────────────────────────────────┤
│  ⚠️ storage-warning banner (hidden by default)  │
├─────────────────────────────────────────────────┤
│              Total Balance: $0.00                │  ← .balance-card
├─────────────────────────────────────────────────┤
│  Add Transaction                                 │  ← .form-section
│  [Item Name ________________]                    │
│  [Amount ___________________]                    │
│  [Category ▼               ]                    │
│  [    Add Transaction      ]                    │
├──────────────────────┬──────────────────────────┤
│  Transactions        │  Spending by Category    │  ← .bottom-section
│  ┌────────────────┐  │  ┌────────────────────┐  │
│  │ Coffee  $4.50  │  │  │   [Pie Chart]      │  │
│  │ Bus     $2.00  │  │  │                    │  │
│  │ ...scrollable  │  │  │                    │  │
│  └────────────────┘  │  └────────────────────┘  │
└──────────────────────┴──────────────────────────┘

Viewport < 600px: .bottom-section stacks to single column
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `localStorage` unavailable on load | Show persistent warning banner; app still works in-memory for the session |
| `localStorage` write fails mid-session | Show dismissible warning; in-memory state remains consistent |
| Corrupted JSON in storage | Silently reset to empty array; remove bad key via `localStorage.removeItem(STORAGE_KEY)` |
| Form submitted with whitespace-only name | Validation fails; error message shown inline below the field |
| Amount with more than 2 decimal places | Validation fails; error message shown inline below the field |
| All transactions deleted | List shows empty-state message; chart shows "No data" label; balance shows `$0.00` |
| Category with zero total | Segment omitted from pie chart; colour is still reserved consistently in `CATEGORY_COLORS` |

---

## Correctness Properties

These are the formal properties the implementation must uphold, expressed as invariants and event-response rules:

### Property 1: Balance Accuracy
`Balance_Display` always equals `transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)` at every point where the UI is visible to the user.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 2: Storage Consistency
`JSON.parse(localStorage.getItem("transactions"))` equals the in-memory `transactions` array after every add or delete operation (when storage is available).

**Validates: Requirements 7.1, 2.3, 4.3**

### Property 3: No Phantom Segments
A category segment is present in the pie chart if and only if the sum of transaction amounts for that category is greater than zero.

**Validates: Requirements 6.2, 6.5, 6.6**

### Property 4: Stable Deletion
Deleting the transaction with `id = X` removes exactly that transaction and no other, regardless of its position in the list.

**Validates: Requirements 4.2, 4.4**

### Property 5: Validation Completeness
A transaction is only added to `transactions` if `itemName.trim().length > 0`, `amount > 0 && amount <= 1_000_000 && decimalPlaces(amount) <= 2`, and `category` is one of `["Food", "Transport", "Fun"]`.

**Validates: Requirements 2.2, 2.6, 2.7, 2.8**

### Property 6: Idempotent Render
Calling `renderAll()` twice in a row with no state change between calls produces identical DOM output both times.

**Validates: Requirements 3.1, 3.3, 6.4**

### Property 7: Corruption Recovery
After a page load where `localStorage["transactions"]` contains invalid JSON, the app renders as if no transactions were stored and the key is absent from storage.

**Validates: Requirements 1.4**

---

## Testing Strategy

No test framework is required (NFR-1). Correctness is verified manually by exercising each property against a running instance in the browser. Each property maps to a concrete browser test scenario:

| Property | Manual Test |
|---|---|
| Balance accuracy | Add 3 transactions; verify displayed total matches hand-calculated sum. Delete one; verify total updates. |
| Storage consistency | Add a transaction; open DevTools → Application → Local Storage; verify stored JSON matches in-memory list. |
| No phantom segments | Add Food and Transport transactions only; confirm Fun segment is absent in the chart. |
| Stable deletion | Add transactions A, B, C; delete B; confirm A and C remain with correct amounts. |
| Validation completeness | Submit form with: (a) blank name, (b) whitespace-only name, (c) amount = 0, (d) amount = 1.234, (e) amount > 1,000,000, (f) no category. Expect blocked submission and inline error for each. |
| Idempotent render | Add a transaction; open DevTools console; call `renderAll()` manually; verify DOM is unchanged. |
| Corruption recovery | In DevTools, set `localStorage["transactions"] = "not-json"`; reload page; verify app starts with empty list and key is removed. |

---

## Sequence Diagrams

### Add Transaction

```
User fills form → clicks "Add Transaction"
  → handleFormSubmit()
      → validateForm()  [fails? show errors, stop]
      → build Transaction object (with UUID)
      → transactions.push(transaction)
      → saveTransactions() → localStorage.setItem(...)
      → renderAll()
          → renderTransactionList()
          → updateBalance()
          → updateChart()
      → form.reset()
```

### Page Load

```
DOMContentLoaded → init()
  → isStorageAvailable() [false? show warning]
  → loadTransactions() → localStorage.getItem(...)
      [corrupt? removeItem, return []]
      [valid? parse, filter, return array]
  → attach event listeners
  → renderAll()
      → renderTransactionList()
      → updateBalance()
      → updateChart()
```

### Delete Transaction

```
User clicks "Delete" on a row
  → deleteTransaction(id)
      → transactions.filter(t => t.id !== id)
      → saveTransactions()
      → renderAll()
```
