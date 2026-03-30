import { calendarEventsQuerySchema, formatZodError } from "./calendar.schema.js";
import { getCalendarEvents, getCalendarMeta } from "./calendar.service.js";

export async function getCalendarMetaData(req, res, next) {
  try {
    const meta = await getCalendarMeta({
      userId: req.auth?.userId,
      role: req.auth?.role,
    });

    res.status(200).json({
      message: "Calendar meta loaded.",
      data: meta,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCalendarEventsData(req, res, next) {
  try {
    const parsed = calendarEventsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const events = await getCalendarEvents({
      userId: req.auth?.userId,
      role: req.auth?.role,
      filters: parsed.data,
    });

    return res.status(200).json({
      message: "Calendar events loaded.",
      data: events,
    });
  } catch (error) {
    return next(error);
  }
}
