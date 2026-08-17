export function formatEmployee(
  name?: string | null,
  department?: string | null,
  empty = '—',
) {
  const person = name?.trim();
  if (!person) return empty;
  const dept = department?.trim();
  return dept ? `${person} · ${dept}` : person;
}
