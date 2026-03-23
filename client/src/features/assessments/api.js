import { http } from "../../lib/http";

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export async function fetchAssessments(filters = {}) {
  const response = await http.get("/assessments", {
    params: compactParams(filters),
  });

  return response.data;
}

export async function fetchAssessmentMeta() {
  const response = await http.get("/assessments/meta");
  return response.data.data;
}

export async function fetchAssessmentById(assessmentId) {
  const response = await http.get(`/assessments/${assessmentId}`);
  return response.data.data;
}

export async function createAssessment(payload) {
  const response = await http.post("/assessments", payload);
  return response.data;
}

export async function updateAssessmentStatus(assessmentId, payload) {
  const response = await http.patch(`/assessments/${assessmentId}/status`, payload);
  return response.data;
}

export async function saveAssessmentGrades(assessmentId, payload) {
  const response = await http.post(`/assessments/${assessmentId}/grades`, payload);
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
