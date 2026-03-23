import { attendanceBoardQuerySchema, formatZodError, saveAttendanceSessionSchema } from "./attendance.schema.js";
import { getAttendanceBoard, getAttendanceMeta, saveAttendanceSession } from "./attendance.service.js";

export async function getAttendanceMetaData(req, res, next) {
  try {
    const meta = await getAttendanceMeta(req.auth?.userId);

    return res.json({
      data: meta,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAttendanceBoardData(req, res, next) {
  try {
    const parsed = attendanceBoardQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const board = await getAttendanceBoard(parsed.data);

    return res.json({
      data: board,
    });
  } catch (error) {
    return next(error);
  }
}

export async function saveAttendanceSessionData(req, res, next) {
  try {
    const parsed = saveAttendanceSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const session = await saveAttendanceSession({
      userId: req.auth?.userId,
      ...parsed.data,
    });

    return res.json({
      message: "Attendance session saved successfully.",
      data: session,
    });
  } catch (error) {
    return next(error);
  }
}
