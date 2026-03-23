import {
  createAssessmentSchema,
  formatZodError,
  listAssessmentsQuerySchema,
  updateAssessmentStatusSchema,
  upsertAssessmentGradesSchema,
} from "./assessments.schema.js";
import {
  createAssessment,
  getAssessmentById,
  getAssessmentOptions,
  listAssessments,
  updateAssessmentStatus,
  upsertAssessmentGrades,
} from "./assessments.service.js";

export async function getAssessments(req, res, next) {
  try {
    const parsed = listAssessmentsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const assessments = await listAssessments(parsed.data);

    return res.json({
      data: assessments,
      total: assessments.length,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAssessment(req, res, next) {
  try {
    const assessment = await getAssessmentById(req.params.assessmentId);

    return res.json({
      data: assessment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAssessmentsMeta(_req, res, next) {
  try {
    const meta = await getAssessmentOptions();

    return res.json({
      data: meta,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createAssessmentRecord(req, res, next) {
  try {
    const parsed = createAssessmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const assessment = await createAssessment(parsed.data);

    return res.status(201).json({
      message: "Assessment created successfully.",
      data: assessment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateAssessmentStatusRecord(req, res, next) {
  try {
    const parsed = updateAssessmentStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const assessment = await updateAssessmentStatus(req.params.assessmentId, parsed.data.status);

    return res.json({
      message: "Assessment status updated successfully.",
      data: assessment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function upsertAssessmentGradesRecord(req, res, next) {
  try {
    const parsed = upsertAssessmentGradesSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const assessment = await upsertAssessmentGrades(req.params.assessmentId, parsed.data.gradeEntries);

    return res.json({
      message: "Grades saved successfully.",
      data: assessment,
    });
  } catch (error) {
    return next(error);
  }
}
