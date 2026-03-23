import { http } from "../../lib/http";

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export async function fetchAttendanceMeta() {
  const response = await http.get("/attendance/meta");
  return response.data.data;
}

export async function fetchAttendanceBoard(filters) {
  const response = await http.get("/attendance/board", {
    params: compactParams(filters),
  });
  return response.data.data;
}

export async function saveAttendanceSession(payload) {
  const response = await http.post("/attendance/session", payload);
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
