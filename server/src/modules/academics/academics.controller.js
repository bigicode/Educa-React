import {
  createAssessmentSchema,
  createClassMappingSchema,
  createSubjectSchema,
  formatZodError,
} from "./academics.schema.js";
import {
  createAssessment,
  createClassMapping,
  createSubject,
  getAcademicsMeta,
  getAcademicsOverview,
} from "./academics.service.js";

export async function getAcademicsOverviewData(_req, res, next) {
  try {
    const overview = await getAcademicsOverview();

    return res.json({
      data: overview,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAcademicsMetaData(_req, res, next) {
  try {
    const meta = await getAcademicsMeta();

    return res.json({
      data: meta,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createAcademicSubjectRecord(req, res, next) {
  try {
    const parsed = createSubjectSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const subject = await createSubject(parsed.data);

    return res.status(201).json({
      message: "Subject created successfully.",
      data: subject,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createAcademicClassMappingRecord(req, res, next) {
  try {
    const parsed = createClassMappingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const mapping = await createClassMapping(parsed.data);

    return res.status(201).json({
      message: "Subject mapped to class successfully.",
      data: mapping,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createAcademicAssessmentRecord(req, res, next) {
  try {
    const parsed = createAssessmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const assessment = await createAssessment(parsed.data);

    return res.status(201).json({
      message: "Assessment scheduled successfully.",
      data: assessment,
    });
  } catch (error) {
    return next(error);
  }
}
