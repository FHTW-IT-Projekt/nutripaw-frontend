// The "export" keyword allows other files to use this function
export function calculateTimeSince(isoDateString) {
    if (!isoDateString) return "Never";

    const pastDate = new Date(isoDateString);
    const now = new Date();
    
    const diffMs = now - pastDate; 
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const timeFormatted = pastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let relativeString = "";
    if (diffDays > 0) {
        relativeString = `(${diffDays} days ago)`;
    } else if (diffHours > 0) {
        relativeString = `(${diffHours}h ago)`;
    } else if (diffMins > 0) {
        relativeString = `(${diffMins}m ago)`;
    } else {
        relativeString = `(Just now)`;
    }

    return `Today, ${timeFormatted} <span class="fst-italic">${relativeString}</span>`;
}