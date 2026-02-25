import express, { type Response } from "express";
import Docker from "dockerode";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";
import cookieParser from "cookie-parser";
import http from "http";

const docker = new Docker();
const app = express();
const PORT = 3001;

app.use(cookieParser());

async function getTargetInfo(
  containerId: string,
  port: string,
): Promise<string | null> {
  try {
    const container = docker.getContainer(containerId);
    if (!container) return null;
    const data = await container.inspect();
    const networks = data.NetworkSettings.Networks;
    const containerIP = Object.values(networks)[0]?.IPAddress;
    return containerIP ? `http://${containerIP}:${port}` : null;
  } catch (err) {
    console.error(`Error looking up container ${containerId}:`, err);
    return null;
  }
}

const proxyOptions: Options = {
  target: "http://localhost:1", //fallback
  router: (req) => (req as any).proxyTarget,
  changeOrigin: true,
  selfHandleResponse: true,
  on: {
    proxyRes: (proxyRes, req, res) => {
      const target = (req as any).proxyTargetInfo;
      const contentType = proxyRes.headers["content-type"];

      if (contentType && contentType.includes("text/html") && target) {
        const { containerId, port } = target;
        const bodyChunks: any[] = [];
        proxyRes.on("data", (chunk) => bodyChunks.push(chunk));
        proxyRes.on("end", () => {
          const body = Buffer.concat(bodyChunks).toString();
          if (body.includes("<base") || body.includes("<BASE")) {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            res.end(body);
            return;
          }

          const baseTag = `<base href="/proxy/${containerId}/${port}/">`;
          const modifiedBody = body.includes("<head>")
            ? body.replace("<head>", `<head>\n    ${baseTag}`)
            : body.includes("<html>")
              ? body.replace("<html>", `<html>\n<head>${baseTag}</head>`)
              : `${baseTag}${body}`;

          res.setHeader("content-type", "text/html");
          res.setHeader("content-length", Buffer.byteLength(modifiedBody));
          res.writeHead(proxyRes.statusCode || 200);
          res.end(modifiedBody);
        });
      } else {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      }
    },
    error: (err, req, res) => {
      console.error("Proxy error:", err.message);
      if (res && "headersSent" in res && !res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Bad gateway — container unreachable" }),
        );
      } else if (res && !("headersSent" in res)) {
        (res as any).destroy();
      }
    },
  },
};

const proxyMiddleware = createProxyMiddleware(proxyOptions);

app.get("/api/info/:containerId/:port", async (req, res) => {
  const { containerId, port } = req.params;
  const targetUrl = await getTargetInfo(containerId, port);
  if (!targetUrl) {
    res.status(404).json({ error: "Container not found or unreachable" });
    return;
  }
  const parts = targetUrl.split("//")[1]?.split(":");
  const containerIP = parts ? parts[0] : "";
  res.json({
    containerId,
    port,
    containerIP,
    url: `http://localhost:3001/proxy/${containerId}/${port}/`,
  });
});

app.use(
  "/proxy/:containerId/:port",
  async (req, res, next) => {
    const { containerId, port } = req.params;
    res.cookie("proxy-target", `${containerId}:${port}`, { path: "/" });

    const targetUrl = await getTargetInfo(containerId, port);
    if (!targetUrl) {
      res.status(404).json({ error: "Container unreachable" });
      return;
    }

    (req as any).proxyTargetInfo = { containerId, port };
    (req as any).proxyTarget = targetUrl;
    next();
  },
  proxyMiddleware,
);

app.use(async (req, res, next) => {
  const target = req.cookies["proxy-target"];
  if (target) {
    const [containerId, port] = target.split(":");
    const targetUrl = await getTargetInfo(containerId || "", port || "");
    if (targetUrl) {
      (req as any).proxyTargetInfo = { containerId, port };
      (req as any).proxyTarget = targetUrl;
      return (proxyMiddleware as any)(req, res, next);
    }
  }
  next();
});

const server = http.createServer(app);

server.setMaxListeners(20);

server.on("upgrade", async (req, socket, head) => {
  const cookies = (req.headers.cookie || "") as string;
  const targetCookie = cookies
    .split(";")
    .find((c) => c.trim().startsWith("proxy-target="))
    ?.split("=")[1];

  if (targetCookie) {
    const [containerId, port] = targetCookie.split(":");
    const targetUrl = await getTargetInfo(containerId || "", port || "");

    if (targetUrl) {
      const wsProxy = createProxyMiddleware({
        target: targetUrl,
        ws: true,
        changeOrigin: true,
      });
      (wsProxy as any).upgrade(req, socket, head);
      return;
    }
  }
  socket.destroy();
});

server.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
