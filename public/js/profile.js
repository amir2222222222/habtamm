document.querySelector('.update-btn').addEventListener('click', async () => {
  const name = document.getElementById('name').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const userId = 'REPLACE_WITH_USER_ID'; // Dynamically get this in a real app

  try {
    const response = await fetch(`/api/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, username, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Profile updated successfully!');
    } else {
      alert(data.message || 'Update failed.');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('An error occurred.');
  }
});
