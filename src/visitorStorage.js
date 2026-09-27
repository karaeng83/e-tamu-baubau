const PUBLIC_VISITS_KEY = "visitorly.public-visits";
const EVENT_PLANS_KEY = "visitorly.event-plans";

function readEntries(key) {
  try {
    const entries = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

export function readPublicVisits() {
  return readEntries(PUBLIC_VISITS_KEY);
}

export function readEventPlans() {
  return readEntries(EVENT_PLANS_KEY);
}

export function savePublicVisit(visit) {
  const key = visit.visitType === "event-plan" ? EVENT_PLANS_KEY : PUBLIC_VISITS_KEY;
  const entries = readEntries(key);
  const initials = visit.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const colors = ["coral", "blue", "green", "violet", "amber", "teal"];
  const savedVisit = {
    id: `V-${Date.now().toString(36).toUpperCase()}`,
    initials,
    badge: initials,
    color: colors[entries.length % colors.length],
    time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
    ...visit,
  };
  localStorage.setItem(key, JSON.stringify([savedVisit, ...entries]));
  return savedVisit;
}
