import {
  createProxyMiddleware,
  type RequestHandler,
} from "http-proxy-middleware";
import { containerService } from "../service/container.service.js";
import type { Request, Response, NextFunction } from "express";

const proxyCache = new Map<string, RequestHandler>();

export const proxyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { containerId, port } = req.params;

  if (!containerId || !port)
    return res.status(400).send("Missing container parameters");

  const cacheKey = `${containerId}-${port}`;

  try {
    let proxy = proxyCache.get(cacheKey);

    if (!proxy) {
      const ip = await containerService.getContainerIP(containerId as string);
      const target = `http://${ip}:${port}`;

      console.log(
        `Creating new proxy for container ${containerId} at ${target}`,
      );

      proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true,
        logger: console,
      });

      proxyCache.set(cacheKey, proxy);
    }

    return proxy(req, res, next);
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).send("Container not found or unreachable");
  }
};
