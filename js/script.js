// Get HTML elements
const form = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const totalBalance = document.getElementById("total-balance");

// Store transactions
let transactions = [];
let expenseChart;

// Load saved transactions
const savedTransactions = localStorage.getItem("transactions");

if (savedTransactions) {
    transactions = JSON.parse(savedTransactions);

    displayTransactions();
    updateBalance();
}
// When user submits the form
form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Get values
    const itemName = document.getElementById("item-name").value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    // Create transaction object
    const transaction = {
        itemName,
        amount,
        category
    };

    // Save into array
    transactions.push(transaction);

    localStorage.setItem(
    "transactions",
    JSON.stringify(transactions)
);
    // Update screen
  displayTransactions();
updateBalance();
updateChart();

    // Clear form
    form.reset();
});

// Display all transactions
function displayTransactions() {

    transactionList.innerHTML = "";

    transactions.forEach(function (transaction, index) {

        const div = document.createElement("div");

        div.innerHTML = `
            <div class="transaction-item">
                <div>
                    <strong>${transaction.itemName}</strong><br>
                    $${transaction.amount.toFixed(2)} • ${transaction.category}
                </div>

                <button onclick="deleteTransaction(${index})">
                    Delete
                </button>
            </div>
            <hr>
        `;

        transactionList.appendChild(div);

    });

}

// Update total balance
function updateBalance() {

    let total = 0;

    transactions.forEach(function (transaction) {
        total += transaction.amount;
    });

    totalBalance.textContent = "$" + total.toFixed(2);

}function updateChart() {

    const food = transactions
        .filter(t => t.category === "Food")
        .reduce((sum, t) => sum + t.amount, 0);

    const transport = transactions
        .filter(t => t.category === "Transport")
        .reduce((sum, t) => sum + t.amount, 0);

    const fun = transactions
        .filter(t => t.category === "Fun")
        .reduce((sum, t) => sum + t.amount, 0);

    if (expenseChart) {
        expenseChart.destroy();
    }

    const ctx = document.getElementById("expenseChart");

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Food", "Transport", "Fun"],
            datasets: [{
                data: [food, transport, fun]
            }]
        }
    });

}

// Delete transaction
function deleteTransaction(index) {

    transactions.splice(index, 1);

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

displayTransactions();
updateBalance();
updateChart();

}