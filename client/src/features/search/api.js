import { http } from "../../lib/http";

export async function fetchGlobalSearchResults(query) {
  const response = await http.get("/search/global", {
    params: { q: query },
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
