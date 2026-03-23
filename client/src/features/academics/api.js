import { http } from "../../lib/http";

export async function fetchAcademicsOverview() {
  const response = await http.get("/academics/overview");
  return response.data.data;
}

export async function fetchAcademicsMeta() {
  const response = await http.get("/academics/meta");
  return response.data.data;
}

export async function createAcademicSubject(payload) {
  const response = await http.post("/academics/subjects", payload);
  return response.data;
}

export async function createAcademicClassMapping(payload) {
  const response = await http.post("/academics/class-mappings", payload);
  return response.data;
}

export async function createAcademicAssessment(payload) {
  const response = await http.post("/academics/assessments", payload);
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
