import { http } from "../../lib/http";

const localTokenKey = "educa_auth_token";
const sessionTokenKey = "educa_auth_token_session";

export function applyAuthToken(token) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete http.defaults.headers.common.Authorization;
}

export function readStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(sessionTokenKey) || window.localStorage.getItem(localTokenKey);
}

export function persistAuthToken(token, remember = true) {
  if (typeof window === "undefined") {
    return;
  }

  if (remember) {
    window.localStorage.setItem(localTokenKey, token);
    window.sessionStorage.removeItem(sessionTokenKey);
    return;
  }

  window.sessionStorage.setItem(sessionTokenKey, token);
  window.localStorage.removeItem(localTokenKey);
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(localTokenKey);
  window.sessionStorage.removeItem(sessionTokenKey);
}

export async function loginUser(payload) {
  const response = await http.post("/auth/login", payload);
  return response.data.data;
}

export async function fetchCurrentUser() {
  const response = await http.get("/auth/me");
  return response.data.data;
}

export function getAuthErrorMessage(error, fallbackMessage) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === "ERR_NETWORK") {
    return `Could not reach ${http.defaults.baseURL}. Make sure the backend server is running and accessible.`;
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
}
