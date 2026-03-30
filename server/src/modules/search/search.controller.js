import { formatZodError, globalSearchQuerySchema } from "./search.schema.js";
import { searchGlobalEntities } from "./search.service.js";

export async function getGlobalSearchData(req, res, next) {
  try {
    const parsed = globalSearchQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodError(parsed.error),
      });
    }

    const results = await searchGlobalEntities({
      userId: req.auth?.userId,
      role: req.auth?.role,
      query: parsed.data.q,
    });

    return res.status(200).json({
      message: "Global search loaded.",
      data: results,
    });
  } catch (error) {
    return next(error);
  }
}
