function toSafeUserPart(userNameOrId) {
  const normalized = String(userNameOrId || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'user';
}

function toPaddedSequence(sequence) {
  const n = Number(sequence);
  if (!Number.isFinite(n) || n < 1) return '001';
  return String(Math.floor(n)).padStart(3, '0');
}

export function toUserBookingReference(userNameOrId, sequence) {
  return `${toSafeUserPart(userNameOrId)}-${toPaddedSequence(sequence)}`;
}

// Backward-compatible fallback for places that only have a raw booking id.
export function toBookingReference(id) {
  if (!id) return 'booking-unknown';
  const normalized = String(id).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (!normalized) return 'booking-unknown';
  return `booking-${normalized.slice(-6)}`;
}

export function buildBookingReferenceMap(bookings) {
  const grouped = new Map();

  for (const booking of bookings || []) {
    const userKey = booking.userId || booking.userName || 'user';
    if (!grouped.has(userKey)) grouped.set(userKey, []);
    grouped.get(userKey).push(booking);
  }

  const result = {};
  for (const [, userBookings] of grouped) {
    const sorted = [...userBookings].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.startTime || 0).getTime();
      const bTime = new Date(b.createdAt || b.startTime || 0).getTime();
      return aTime - bTime;
    });

    sorted.forEach((booking, index) => {
      const displayName = booking.userName || booking.userId || 'user';
      result[booking.id] = toUserBookingReference(displayName, index + 1);
    });
  }

  return result;
}