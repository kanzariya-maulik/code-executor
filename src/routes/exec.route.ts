import { Router } from "express";
import { execController } from "../controller/exec.controller.js";

const router = Router();

router.post("/run", execController);

export default router;
