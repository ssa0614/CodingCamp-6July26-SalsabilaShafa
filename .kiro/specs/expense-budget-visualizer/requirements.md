# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to record, categorize, and visualize their personal expenses. The app runs entirely in the browser with no backend, using HTML, CSS, and vanilla JavaScript. All data persists across sessions via the browser's Local Storage API. Users can add and delete transactions, view a running total balance, and see a pie chart breaking down spending by category. The app must be simple, fast, and visually clear — suitable for use as a standalone web page or browser extension.

---

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense record consisting of an item name, a monetary amount, and a category.
- **Transaction_List**: The in-memory array of Transaction objects that mirrors the persisted state in Local Storage.
- **Transaction_Form**: The HTML form used to input a new Transaction.
- **Balance_Display**: The UI element that shows the computed total of all Transaction amounts.
- **Category**: A label grouping Transactions by type (e.g., Food, Transport, Fun).
- **Chart**: The pie chart rendered by Chart.js that visualises spending per Category.
- **Local_Storage**: The browser's `localStorage` API used as the sole persistence layer.
- **Storage_Key**: The string key `"transactions"` used to read and write the Transaction_List in Local_Storage.

---

## Requirements

### Requirement 1: Load Persisted Transactions on Startup

**User Story:** As a user, I want my previously entered transactions to be visible when I reopen the app, so that I do not have to re-enter data every session.

#### Acceptance Criteria

1. WHEN the App is loaded in a browser, THE App SHALL read the Transaction_List from Local_Storage using the Storage_Key.
2. WHEN the App is loaded and Local_Storage contains a valid JSON array under the Storage_Key, THE App SHALL parse the stored JSON and populate the Transaction_List with the stored Transaction objects, where each object has a string `itemName`, a numeric `amount`, and a `category` value from the valid Category list.
3. WHEN the App is loaded and Local_Storage contains no value under the Storage_Key, THE App SHALL initialise the Transaction_List as an empty array.
4. IF Local_Storage contains a value under the Storage_Key that cannot be parsed as valid JSON, THEN THE App SHALL initialise the Transaction_List as an empty array and remove the corrupted value from Local_Storage so it does not persist across sessions.
5. WHEN the App finishes loading, THE App SHALL render the Transaction_List, Balance_Display, and Chart to reflect the loaded data.

---

### Requirement 2: Add a New Transaction

**User Story:** As a user, I want to enter an item name, amount, and category to record a new expense, so that I can track where my money is going.

#### Acceptance Criteria

1. THE Transaction_Form SHALL contain an item name text input (maximum 100 characters), a numeric amount input, and a Category select element.
2. WHEN the user submits the Transaction_Form with all fields filled, THE App SHALL create a Transaction object with a non-empty `itemName` string, a positive numeric `amount`, and a `category` from the valid Category list.
3. WHEN a Transaction is created, THE App SHALL append the Transaction to the Transaction_List and write the updated Transaction_List to Local_Storage as a JSON string.
4. WHEN a Transaction is created, THE App SHALL re-render the Transaction_List display, the Balance_Display, and the Chart to reflect the new Transaction.
5. WHEN a Transaction is successfully added, THE App SHALL reset the Transaction_Form to its empty default state.
6. IF the user submits the Transaction_Form with the item name field empty or containing only whitespace characters, THEN THE App SHALL prevent form submission and display a validation message indicating the item name is required.
7. IF the user submits the Transaction_Form with the amount field empty, containing a non-positive value, or containing a value greater than 1,000,000 or with more than 2 decimal places, THEN THE App SHALL prevent form submission and display a validation message indicating a valid positive amount is required.
8. IF the user submits the Transaction_Form with no Category selected, THEN THE App SHALL prevent form submission and display a validation message indicating a category must be selected.

---

### Requirement 3: Display Transaction List

**User Story:** As a user, I want to see all recorded transactions in a list, so that I can review my expense history.

#### Acceptance Criteria

1. THE App SHALL render each Transaction in the Transaction_List as a distinct row showing the item name, amount formatted to two decimal places preceded by the `$` symbol, and the category.
2. WHILE the Transaction_List is empty, THE App SHALL display a visible message inside the list container communicating the absence of transactions (e.g., "No transactions recorded yet.").
3. THE App SHALL render the Transaction_List in the order that Transactions were added, from oldest at the top to newest at the bottom.
4. WHERE the Transaction_List contains more rows than the visible area of the list container, THE App SHALL make the list container independently scrollable while the two-column grid layout (Transaction_List and Chart side by side) remains unaffected.

---

### Requirement 4: Delete a Transaction

**User Story:** As a user, I want to remove an individual transaction, so that I can correct mistakes or remove unwanted entries.

#### Acceptance Criteria

1. THE App SHALL display a delete control for each Transaction row in the Transaction_List.
2. WHEN the user activates the delete control for a Transaction, THE App SHALL immediately remove that Transaction from the Transaction_List without requiring a confirmation step.
3. WHEN a Transaction is removed, THE App SHALL write the updated Transaction_List to Local_Storage, replacing the previous stored value.
4. WHEN a Transaction is removed, THE App SHALL re-render the Transaction_List display, the Balance_Display, and the Chart to reflect the removal; if the last Transaction was removed, the Chart SHALL display with no data segments (empty state).

---

### Requirement 5: Display Running Total Balance

**User Story:** As a user, I want to see the total sum of all my recorded expenses, so that I can monitor my overall spending at a glance.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all Transaction amounts formatted to two decimal places preceded by the `$` symbol (e.g., `$12.50`).
2. WHEN the Transaction_List changes (by addition or deletion), THE App SHALL recalculate the total and update the Balance_Display within 1 second.
3. WHILE the Transaction_List is empty, THE Balance_Display SHALL show `$0.00`.
4. WHEN the App is loaded and the Transaction_List is restored from Local_Storage, THE Balance_Display SHALL reflect the sum of the restored transactions.

---

### Requirement 6: Visualise Spending by Category with a Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending broken down by category, so that I can understand which areas consume the most of my budget.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart using the Chart.js library loaded from a CDN.
2. THE Chart SHALL display one segment per Category that has a non-zero total amount, with each segment sized proportionally to that category's share of the total.
3. THE Chart SHALL display a label for each segment identifying the Category name.
4. WHEN the Transaction_List changes (by addition or deletion) or when the App finishes loading from Local_Storage, THE App SHALL destroy the existing Chart instance and re-render the Chart with updated data.
5. WHILE all Transaction amounts for a Category are zero or that Category has no Transactions, THE Chart SHALL omit that Category's segment from the rendered Chart.
6. WHILE the Transaction_List is empty, THE App SHALL render the Chart canvas with no visible segments and display a "no data" label to indicate the empty state.

---

### Requirement 7: Persist All Changes to Local Storage

**User Story:** As a user, I want my expense data to survive page refreshes and browser restarts, so that I never lose my recorded history.

#### Acceptance Criteria

1. WHEN the Transaction_List is modified (Transaction added or deleted), THE App SHALL write the complete, updated Transaction_List to Local_Storage using the Storage_Key.
2. THE App SHALL store Transaction data exclusively in Local_Storage and SHALL NOT transmit any data to external servers or services.
3. WHEN Local_Storage is unavailable (e.g., private browsing mode with storage blocked), THE App SHALL display a non-blocking, session-persistent warning banner informing the user that data will not be saved between sessions.
4. IF a Local_Storage write operation fails mid-session (e.g., quota exceeded or SecurityError), THEN THE App SHALL display a non-blocking warning message informing the user that the latest change could not be saved.

---

### Requirement 8: Category Management

**User Story:** As a user, I want a fixed, clearly labelled set of expense categories to choose from, so that my spending is consistently organised without requiring manual input.

#### Acceptance Criteria

1. THE Transaction_Form SHALL offer exactly the following Category options: Food, Transport, Fun.
2. WHEN the Chart renders, THE App SHALL assign each Category a fixed colour that is unique across all three categories (no two categories share the same colour).
3. THE App SHALL apply the same fixed colour per Category in the Chart on every render cycle, including when a Category has zero transactions.

---

### Requirement 9: Responsive Layout and Visual Hierarchy

**User Story:** As a user, I want the interface to be clean and easy to read on desktop browsers, so that I can use the app without confusion or visual clutter.

#### Acceptance Criteria

1. THE App SHALL display the Balance_Display card, Transaction_Form, Transaction_List, and Chart within a single centred container with a maximum width of 900 pixels.
2. WHERE the browser viewport is 600 pixels wide or wider, THE App SHALL arrange the Transaction_List and the Chart side by side in a two-column grid layout.
3. THE App SHALL apply `padding: 20px`, `border-radius: 12px`, and `box-shadow: 0 3px 10px rgba(0,0,0,0.1)` to card-style sections to establish a clear visual hierarchy.
4. THE App SHALL use a `font-size` of at least 14px and a `line-height` of at least 1.4 for transaction rows.
5. WHERE the browser viewport is narrower than 600 pixels, THE App SHALL stack the Transaction_List and Chart vertically in a single-column layout.
