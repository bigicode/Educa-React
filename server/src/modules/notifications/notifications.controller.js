import { getNotificationsOverview } from "./notifications.service.js";

export async function getNotificationsOverviewData(req, res, next) {
  try {
    const overview = await getNotificationsOverview({
      userId: req.auth?.userId,
      role: req.auth?.role,
    });

    return res.status(200).json({
      message: "Notifications overview loaded.",
      data: overview,
    });
  } catch (error) {
    return next(error);
  }
}
