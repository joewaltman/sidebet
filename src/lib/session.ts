// Session management utilities for localStorage

export interface UserSession {
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

const STORAGE_KEYS = {
  PHONE: 'userPhone',
  FIRST_NAME: 'userFirstName',
  LAST_NAME: 'userLastName',
};

/**
 * Get user session from localStorage
 */
export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const phoneNumber = localStorage.getItem(STORAGE_KEYS.PHONE);
  const firstName = localStorage.getItem(STORAGE_KEYS.FIRST_NAME);
  const lastName = localStorage.getItem(STORAGE_KEYS.LAST_NAME);

  if (!phoneNumber || !firstName || !lastName) {
    return null;
  }

  return { phoneNumber, firstName, lastName };
}

/**
 * Set user session in localStorage
 */
export function setUserSession(session: UserSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.PHONE, session.phoneNumber);
  localStorage.setItem(STORAGE_KEYS.FIRST_NAME, session.firstName);
  localStorage.setItem(STORAGE_KEYS.LAST_NAME, session.lastName);
}

/**
 * Clear user session from localStorage
 */
export function clearUserSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.PHONE);
  localStorage.removeItem(STORAGE_KEYS.FIRST_NAME);
  localStorage.removeItem(STORAGE_KEYS.LAST_NAME);
}
