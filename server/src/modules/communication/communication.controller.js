import {
  communicationOverviewQuerySchema,
  createAnnouncementSchema,
  formatZodError,
  updateAnnouncementSchema,
} from "./communication.schema.js";
import {
  createAnnouncement,
  getCommunicationOverview,
  updateAnnouncement,
} from "./communication.service.js";

export async function getCommunicationOverviewData(req, res, next) {
  try {
    const parsed = communicationOverviewQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const overview = await getCommunicationOverview({
      userId: req.auth?.userId,
      role: req.auth?.role,
      filters: parsed.data,
    });

    return res.status(200).json({
      message: "Communication overview loaded.",
      data: overview,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createAnnouncementRecord(req, res, next) {
  try {
    const parsed = createAnnouncementSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const announcement = await createAnnouncement({
      userId: req.auth?.userId,
      role: req.auth?.role,
      data: parsed.data,
    });

    return res.status(201).json({
      message: "Announcement created successfully.",
      data: announcement,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateAnnouncementRecord(req, res, next) {
  try {
    const parsed = updateAnnouncementSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const announcement = await updateAnnouncement({
      userId: req.auth?.userId,
      role: req.auth?.role,
      announcementId: req.params.announcementId,
      data: parsed.data,
    });

    return res.status(200).json({
      message: "Announcement updated successfully.",
      data: announcement,
    });
  } catch (error) {
    return next(error);
  }
}
