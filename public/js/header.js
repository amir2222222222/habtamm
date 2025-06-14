function updateClock() {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  document.querySelector(".clock").textContent = `${date} ${time}`;
}
updateClock();
setInterval(updateClock, 1000);

// Balance
async function toggleBalance() {
  const balanceBtn = document.querySelector(".balance");
  try {
    const response = await fetch("/balance"); // Adjusted to match your route
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    balanceBtn.textContent = data.balance
      ? `Birr ${data.balance}`
      : "Show Balance";
  } catch (error) {
    balanceBtn.textContent = "Error fetching";
  }
}