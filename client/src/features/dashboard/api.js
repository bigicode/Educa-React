import { http } from "../../lib/http";

export async function fetchDashboardOverview() {
  const response = await http.get("/dashboard/overview");
  return response.data.data;
}

export function getApiErrorMessage(error, fallbackMessage) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === "ERR_NETWORK") {
    return `Could not reach ${http.defaults.baseURL}. Make sure the backend server is running and accessible.`;
  }

  return fallbackMessage;
}
