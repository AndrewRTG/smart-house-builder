// Spring Boot's default Jackson serializer returns LocalDateTime as an
// array [year, month, day, hour, minute, second, nanos]. new Date(array)
// returns Invalid Date for that. This helper normalizes both formats.
export function parseDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, min = 0, s = 0] = value;
    return new Date(y, m - 1, d, h, min, s);
  }
  return new Date(value);
}

export function formatDate(value, options = {}) {
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return 'Nespecificat';
  return d.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

export function formatRelativeDate(value) {
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return 'recent';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'acum câteva secunde';
  if (seconds < 3600) return `acum ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `acum ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `acum ${Math.floor(seconds / 86400)} zile`;
  return formatDate(value, { month: 'short' });
}
