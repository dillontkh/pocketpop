// --- Formatters & Helpers ---

export function formatTxDate(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[d.getDay()];
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = String(d.getFullYear()).slice(-2);
    
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${dayName} ${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

export function formatLastReset(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    // Normalize to midnight to calculate pure days passed
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffTime = nowMidnight - dateMidnight;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Reset today';
    } else if (diffDays === 1) {
        return 'Reset yesterday';
    } else if (diffDays < 7) {
        return `Reset ${diffDays} days ago`;
    } else {
        const options = { month: 'short', day: 'numeric' };
        return `Reset ${date.toLocaleDateString(undefined, options)}`;
    }
}

export function showError(element) {
    if (!element) return;
    element.classList.remove('opacity-0');
    setTimeout(() => {
        element.classList.add('opacity-0');
    }, 2500);
}
