import { http } from "../../lib/http";

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export async function fetchTeachers(filters = {}) {
  const response = await http.get("/teachers", {
    params: compactParams(filters),
  });

  return response.data;
}

export async function fetchTeacherMeta() {
  const response = await http.get("/teachers/meta");
  return response.data.data;
}

export async function fetchTeacherById(teacherId) {
  const response = await http.get(`/teachers/${teacherId}`);
  return response.data.data;
}

export async function createTeacher(payload) {
  const response = await http.post("/teachers", payload);
  return response.data;
}

export async function updateTeacher(teacherId, payload) {
  const response = await http.patch(`/teachers/${teacherId}`, payload);
  return response.data;
}

export async function archiveTeacher(teacherId) {
  const response = await http.patch(`/teachers/${teacherId}/archive`);
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
