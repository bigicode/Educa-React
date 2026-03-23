import { http } from "../../lib/http";

export async function fetchCommunicationOverview(filters = {}) {
  const response = await http.get("/communication/overview", {
    params: filters,
  });

  return response.data.data;
}

export async function createAnnouncement(payload) {
  const response = await http.post("/communication/announcements", payload);
  return response.data;
}

export async function updateAnnouncement(announcementId, payload) {
  const response = await http.patch(`/communication/announcements/${announcementId}`, payload);
  return response.data;
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
