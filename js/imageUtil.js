const API_BASE = 'http://127.0.0.1:3000';

export function getImageUrl(imageUrl, fallback = 'https://placecats.com/80/80') {
    if (!imageUrl) return fallback;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/uploads')) return `${API_BASE}${imageUrl}`;
    return `${API_BASE}/uploads/${imageUrl}`;
}
