import { http } from "../../lib/http";

export async function fetchCalendarMeta() {
  const response = await http.get("/calendar/meta");
  return response.data.data;
}

export async function fetchCalendarEvents(filters = {}) {
  const response = await http.get("/calendar/events", {
    params: filters,
  });

  return response.data.data;
}

export function getApiErrorMessage(error, fallbackMessage) {
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
