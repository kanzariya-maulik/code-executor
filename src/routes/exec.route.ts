import express from "express";
import { execController } from "../controller/exec.controller.js";

const router: express.Router = express.Router();

router.post("/run", execController);

export default router;
