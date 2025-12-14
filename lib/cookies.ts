import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  expires: 7,
};

const SHORT_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  expires: 1,
};

export const COOKIE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user_data',
  THEME: 'theme_preference',
  TWO_FA_USER_ID: '2fa_user_id',
} as const;

export function setCookie(key: string, value: string, options = COOKIE_OPTIONS) {
  Cookies.set(key, value, options);
}

export function getCookie(key: string): string | undefined {
  return Cookies.get(key);
}

export function removeCookie(key: string) {
  Cookies.remove(key);
}

export function setAuthToken(token: string) {
  setCookie(COOKIE_KEYS.AUTH_TOKEN, token, SHORT_COOKIE_OPTIONS);
}

export function getAuthToken(): string | undefined {
  return getCookie(COOKIE_KEYS.AUTH_TOKEN);
}

export function removeAuthToken() {
  removeCookie(COOKIE_KEYS.AUTH_TOKEN);
}

export function setUserData(user: any) {
  const userData = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
  setCookie(COOKIE_KEYS.USER, JSON.stringify(userData), SHORT_COOKIE_OPTIONS);
}

export function getUserData(): any | null {
  const userData = getCookie(COOKIE_KEYS.USER);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
}

export function removeUserData() {
  removeCookie(COOKIE_KEYS.USER);
}

export function setTheme(theme: 'light' | 'dark') {
  setCookie(COOKIE_KEYS.THEME, theme, COOKIE_OPTIONS);
}

export function getTheme(): 'light' | 'dark' | undefined {
  return getCookie(COOKIE_KEYS.THEME) as 'light' | 'dark' | undefined;
}

export function set2FAUserId(userId: number) {
  setCookie(COOKIE_KEYS.TWO_FA_USER_ID, String(userId), {
    ...COOKIE_OPTIONS,
    expires: 1 / 24,
  });
}

export function get2FAUserId(): number | null {
  const userId = getCookie(COOKIE_KEYS.TWO_FA_USER_ID);
  return userId ? parseInt(userId, 10) : null;
}

export function remove2FAUserId() {
  removeCookie(COOKIE_KEYS.TWO_FA_USER_ID);
}

export function clearAuthCookies() {
  removeAuthToken();
  removeUserData();
  remove2FAUserId();
}
