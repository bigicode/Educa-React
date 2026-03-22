import {
  updateStudentSchema,
  createStudentSchema,
  formatZodError,
  listStudentsQuerySchema,
} from "./students.schema.js";
import {
  archiveStudent,
  createStudent,
  getStudentById,
  getStudentOptions,
  listStudents,
  updateStudent,
} from "./students.service.js";

export async function getStudents(req, res, next) {
  try {
    const parsed = listStudentsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const students = await listStudents(parsed.data);

    return res.json({
      data: students,
      total: students.length,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudent(req, res, next) {
  try {
    const student = await getStudentById(req.params.studentId);

    return res.json({
      data: student,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentsMeta(_req, res, next) {
  try {
    const options = await getStudentOptions();

    return res.json({
      data: options,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createStudentRecord(req, res, next) {
  try {
    const parsed = createStudentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const student = await createStudent(parsed.data);

    return res.status(201).json({
      message: "Student created successfully.",
      data: student,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateStudentRecord(req, res, next) {
  try {
    const parsed = updateStudentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const student = await updateStudent(req.params.studentId, parsed.data);

    return res.json({
      message: "Student updated successfully.",
      data: student,
    });
  } catch (error) {
    return next(error);
  }
}

export async function archiveStudentRecord(req, res, next) {
  try {
    const student = await archiveStudent(req.params.studentId);

    return res.json({
      message: "Student archived successfully.",
      data: student,
    });
  } catch (error) {
    return next(error);
  }
}
