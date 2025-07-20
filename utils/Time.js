// Utils/Time.js

function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const hh = String(today.getHours() % 12 || 12).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    const ss = String(today.getSeconds()).padStart(2, '0');
    const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} ${ampm}`;
  }
  
  module.exports = { getTodayDate };
  