import { http } from "../../lib/http";

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export async function fetchStudents(filters = {}) {
  const response = await http.get("/students", {
    params: compactParams(filters),
  });

  return response.data;
}

export async function fetchStudentMeta() {
  const response = await http.get("/students/meta");
  return response.data.data;
}

export async function fetchStudentById(studentId) {
  const response = await http.get(`/students/${studentId}`);
  return response.data.data;
}

export async function createStudent(payload) {
  const response = await http.post("/students", payload);
  return response.data;
}

export async function updateStudent(studentId, payload) {
  const response = await http.patch(`/students/${studentId}`, payload);
  return response.data;
}

export async function archiveStudent(studentId) {
  const response = await http.patch(`/students/${studentId}/archive`);
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
