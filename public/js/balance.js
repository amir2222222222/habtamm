// Fetch balance data from the server and render it in a table
async function fetchBalanceData() {
    try {
      const response = await fetch('/balance');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const balanceData = await response.json();
      renderBalanceTable(balanceData);
    } catch (error) {
      console.error('Failed to fetch balance data:', error);
      document.getElementById('error-message').textContent = 'Failed to load data.';
    }
  }
  
  function renderBalanceTable(data) {
    const tableBody = document.getElementById('balance-table-body');
    tableBody.innerHTML = ''; // Clear previous rows
  
    data.forEach(user => {
      const row = document.createElement('tr');
  
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.username}</td>
        <td>${user.shop}</td>
        <td>${user.credit}</td>
        <td>${user.balance}</td>
        <td>${user.percent}%</td>
        <td>${user.percentValue}</td>
        <td>${user.edited}</td>
      `;
  
      tableBody.appendChild(row);
    });
  }
  
  // Trigger the fetch when the page loads
  window.onload = fetchBalanceData;
  