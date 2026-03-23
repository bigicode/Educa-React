import { getDashboardOverview } from "./dashboard.service.js";

export async function getDashboardOverviewData(req, res, next) {
  try {
    const overview = await getDashboardOverview({
      userId: req.auth?.userId,
      role: req.auth?.role,
    });

    res.status(200).json({
      message: "Dashboard overview loaded.",
      data: overview,
    });
  } catch (error) {
    next(error);
  }
}
