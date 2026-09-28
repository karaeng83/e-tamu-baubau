export const ACCOUNTS_KEY = "baubau.user-accounts.v1";
export const SESSION_KEY = "baubau.superadmin-session.v1";

export const USER_ROLES = {
  superadmin: { label: "Superadmin", pages: ["overview", "visitors", "history", "appointments", "approvals", "frontdesk", "evacuation", "reports", "feedback", "masters", "users", "integrations"] },
  settings_admin: { label: "Admin Pengaturan", pages: ["overview", "reports", "masters", "integrations"] },
  location_admin: { label: "Admin Gedung/Lokasi", pages: ["overview", "visitors", "history", "appointments", "approvals", "frontdesk", "evacuation", "reports", "feedback"] },
  user: { label: "User Biasa", pages: ["overview", "appointments", "history"] },
};

export const DEFAULT_ACCOUNTS = [{
  id: "root-admin",
  name: "Superadmin",
  email: "admin@admin.com",
  password: "admin5678",
  role: "superadmin",
  building: "Kantor Wali Kota Baubau",
  active: true,
}];

export function readUserAccounts() {
  try {
    const stored = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    const accounts = Array.isArray(stored) ? stored.filter((account) => account && typeof account.email === "string") : [];
    const root = accounts.find((account) => account.email.toLowerCase() === "admin@admin.com");
    const otherAccounts = accounts.filter((account) => account.email.toLowerCase() !== "admin@admin.com");
    return [{ ...DEFAULT_ACCOUNTS[0], ...root, id: "root-admin", role: "superadmin", active: true }, ...otherAccounts];
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function authenticateAccount(accounts, email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  return accounts.find((account) => account.active !== false && account.email.toLowerCase() === normalizedEmail && account.password === password) || null;
}