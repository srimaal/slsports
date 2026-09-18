import { handleHealth } from "../server/apiRouter";

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return handleHealth(req, res);
}
