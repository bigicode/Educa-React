import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getGlobalSearchData } from "./search.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/global", getGlobalSearchData);

export const searchRouter = router;
