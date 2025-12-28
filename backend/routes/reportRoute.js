import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { revenueReport } from "../controllers/reportController.js";

const reportRouter = express.Router();

// POST /api/report/revenue
reportRouter.post("/revenue", adminAuth, revenueReport);

export default reportRouter;

