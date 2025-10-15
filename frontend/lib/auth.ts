"use client";

// Simple client-side auth using localStorage.
// Not secure for production; replace with a proper backend when available.

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string; // hashed in real apps; plain for demo
  department: string;
  role: 'admin' | 'staff';
};

const USERS_KEY = "ams.users";
const SESSION_KEY = "ams.sessionUserId";

function generateId(): string {
  try {
    // Prefer secure randomUUID when available (modern browsers)
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as any).crypto &&
      typeof (globalThis as any).crypto.randomUUID === "function"
    ) {
      return (globalThis as any).crypto.randomUUID();
    }
  } catch {
    // ignore and fallback
  }
  // Fallback: not cryptographically secure, but fine for demo/localStorage IDs
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function readUsers(): UserRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    // debug: log number of users found
    // eslint-disable-next-line no-console
    console.debug(`auth.readUsers -> ${Array.isArray(parsed) ? parsed.length : 0} users`) 
    if (Array.isArray(parsed)) return parsed as UserRecord[];
    return [];
  } catch {
    return [];
  }
}

function writeUsers(users: UserRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // debug: log write
  // eslint-disable-next-line no-console
  console.debug(`auth.writeUsers -> wrote ${users.length} users`)
}

export function registerUser(
  newUser: Omit<UserRecord, "id">
): { ok: true } | { ok: false; error: string } {
  const users = readUsers();
  const existsByEmail = users.some(
    (u) => u.email.toLowerCase() === newUser.email.toLowerCase()
  );
  const existsByFullName = users.some(
    (u) => u.name.toLowerCase() === newUser.name.toLowerCase()
  );
  if (existsByEmail) return { ok: false, error: "Email already registered" };
  if (existsByFullName)
    return { ok: false, error: "Name already registered" };
  // Ensure role is valid and default to 'staff'
  const allowedRoles = new Set(['admin', 'staff']);
  const role = newUser.role && allowedRoles.has(newUser.role) ? newUser.role : 'staff';
  const user: UserRecord = { id: generateId(), ...newUser, role } as UserRecord;
  users.push(user);
  writeUsers(users);
  // debug: newly registered user
  // eslint-disable-next-line no-console
  console.debug('auth.registerUser -> registered', { id: user.id, name: user.name, email: user.email })
  // auto-login on registration
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, user.id);
  }
  return { ok: true };
}

export function loginWithFullName(
  name: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const users = readUsers();
  const user = users.find((u) => u.name.trim().toLowerCase() === name.trim().toLowerCase());
  // debug: login attempt
  // eslint-disable-next-line no-console
  console.debug('auth.loginWithFullName -> attempt', { name, found: !!user, usersCount: users.length })
  if (!user) return { ok: false, error: "User not found" };
  if (user.password !== password)
    return { ok: false, error: "Invalid password" };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, user.id);
  }
  return { ok: true };
}

/**
 * Try login by either full_name or email (identifier may be full name or email)
 */
export function loginByIdentifier(
  identifier: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const users = readUsers();
  const id = identifier.trim();
  const lower = id.toLowerCase();
  const user = users.find(
    (u) => u.name.trim().toLowerCase() === lower || u.email.trim().toLowerCase() === lower
  );
  // debug: login by identifier
  // eslint-disable-next-line no-console
  console.debug('auth.loginByIdentifier -> attempt', { identifier: id, found: !!user, usersCount: users.length })
  if (!user) return { ok: false, error: "User not found" };
  if (user.password !== password) return { ok: false, error: "Invalid password" };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, user.id);
  }
  return { ok: true };
}

export function getCurrentUser(): UserRecord | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const users = readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
