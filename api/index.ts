import express from "express";
import { registerApiRoutes } from "../server/apiRouter";

const app = express();
app.use(express.json({ limit: "10mb" }));

registerApiRoutes(app);

export default app;
