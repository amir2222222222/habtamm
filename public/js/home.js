const grid = document.getElementById("cardGrid");
const selectedCells = new Set();

// Generate 150 cards
for (let i = 1; i <= 150; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.textContent = i;
  cell.onclick = () => toggleCell(i, cell);
  grid.appendChild(cell);
}

function toggleCell(number, cell) {
  if (selectedCells.has(number)) {
    selectedCells.delete(number);
    cell.classList.remove("active");
  } else {
    selectedCells.add(number);
    cell.classList.add("active");
  }
}

// Handle form submission
function submitPlay() {
  const zValue = parseInt(document.getElementById("zInput").value);
  const bet = parseInt(document.getElementById("betInput").value);

  if (!zValue || !bet || selectedCells.size === 0) {
    alert("Please select cards and fill bet details.");
    return;
  }

  const payload = {
    selected: Array.from(selectedCells),
    zValue: zValue,
    bet: bet,
  };

  fetch("/home", {
    // Ensure the correct endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.redirected) {
        window.location.href = res.url; // Redirect to dashboard if successful
      } else {
        return res.json(); // Handle error response
      }
    })
    .then((data) => {
      console.log("Server response:", data);
    })
    .catch((err) => {
      console.error("Error submitting play:", err);
    });
}

// Optional prompt-based card selection
let consoleActive = false;

function startConsoleInput() {
  consoleActive = true;
  handleConsoleInput();
}

function handleConsoleInput() {
  if (!consoleActive) return;

  setTimeout(() => {
    const input = prompt("Select Card (type 'ok' to finish):");

    if (input === null || input.toLowerCase() === "ok") {
      consoleActive = false;
      return;
    }

    const num = parseInt(input.trim());

    if (isNaN(num) || num < 1 || num > 150) {
      alert("Card unavailable");
    } else if (selectedCells.has(num)) {
      alert("Already picked, thank you");
    } else {
      selectedCells.add(num);
      grid.children[num - 1].classList.add("active");
    }

    handleConsoleInput();
  }, 100);
}

// Adjust input values
function adjust(field, change) {
  const input = document.getElementById(field === "z" ? "zInput" : "betInput");
  let value = parseInt(input.value) || 0;
  let newValue = value + change;

  if (field === "z") {
    input.value = Math.max(1, Math.min(5, newValue)); // z value range 1–5
  } else {
    input.value = Math.max(10, newValue); // bet minimum is 10
  }
}
