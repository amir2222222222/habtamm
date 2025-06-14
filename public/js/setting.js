window.addEventListener('DOMContentLoaded', () => {
    fetch('/get-voices')
      .then(res => res.json())
      .then(data => {
        const select = document.getElementById('voice');
        data.voices.forEach(voice => {
          const opt = document.createElement('option');
          opt.value = voice.id;
          opt.textContent = voice.name;
          select.appendChild(opt);
        });
      })
      .catch(err => {
        console.warn('Voice list failed to load.', err);
      });
  });

  document.getElementById('soundForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const speed = document.getElementById('speed').value;
    const voice = document.getElementById('voice').value;
    console.log('Submitting Sound Setting:', { speed, voice });
    alert("🔊 Sound settings updated successfully!");
  });

  document.getElementById('patternForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('#patternCheckboxes input[type="checkbox"]');
    const checked = Array.from(checkboxes).filter(cb => cb.checked);

    if (checked.length === 0) {
      alert("⚠️ Please select at least one pattern option.");
      return;
    }

    const selectedPatterns = checked.map(cb => cb.value);
    console.log('Submitting Patterns:', selectedPatterns);
    alert("📋 Checking pattern updated successfully!");
  });