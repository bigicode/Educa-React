import {
  createTeacherSchema,
  formatZodError,
  listTeachersQuerySchema,
  updateTeacherSchema,
} from "./teachers.schema.js";
import {
  archiveTeacher,
  createTeacher,
  getTeacherById,
  getTeacherOptions,
  listTeachers,
  updateTeacher,
} from "./teachers.service.js";

export async function getTeachers(req, res, next) {
  try {
    const parsed = listTeachersQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const teachers = await listTeachers(parsed.data);

    return res.json({
      data: teachers,
      total: teachers.length,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTeacher(req, res, next) {
  try {
    const teacher = await getTeacherById(req.params.teacherId);

    return res.json({
      data: teacher,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTeachersMeta(_req, res, next) {
  try {
    const options = await getTeacherOptions();

    return res.json({
      data: options,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createTeacherRecord(req, res, next) {
  try {
    const parsed = createTeacherSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const teacher = await createTeacher(parsed.data);

    return res.status(201).json({
      message: "Teacher created successfully.",
      data: teacher,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateTeacherRecord(req, res, next) {
  try {
    const parsed = updateTeacherSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const teacher = await updateTeacher(req.params.teacherId, parsed.data);

    return res.json({
      message: "Teacher updated successfully.",
      data: teacher,
    });
  } catch (error) {
    return next(error);
  }
}

export async function archiveTeacherRecord(req, res, next) {
  try {
    const teacher = await archiveTeacher(req.params.teacherId);

    return res.json({
      message: "Teacher archived successfully.",
      data: teacher,
    });
  } catch (error) {
    return next(error);
  }
}
