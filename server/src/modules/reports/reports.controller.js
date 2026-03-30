import { formatZodError, reportsOverviewQuerySchema } from "./reports.schema.js";
import { getReportsMeta, getReportsOverview } from "./reports.service.js";

export async function getReportsMetaData(req, res, next) {
  try {
    const meta = await getReportsMeta({
      userId: req.auth?.userId,
      role: req.auth?.role,
    });

    res.status(200).json({
      message: "Reports meta loaded.",
      data: meta,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportsOverviewData(req, res, next) {
  try {
    const parsed = reportsOverviewQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const overview = await getReportsOverview({
      userId: req.auth?.userId,
      role: req.auth?.role,
      filters: parsed.data,
    });

    return res.status(200).json({
      message: "Reports overview loaded.",
      data: overview,
    });
  } catch (error) {
    return next(error);
  }
}
