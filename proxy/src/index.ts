import express from "express";
import Docker from "dockerode";
import { createProxyMiddleware } from "http-proxy-middleware";
import cookieParser from "cookie-parser";

const docker = new Docker();
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cookieParser());

app.get("/api/info/:containerId/:port", async (req, res) => {
  const { containerId, port } = req.params;
  try {
    const container = docker.getContainer(containerId);
    const data = await container.inspect();
    const networks = data.NetworkSettings.Networks;
    const containerIP = Object.values(networks)[0]?.IPAddress;
    if (!containerIP) {
      res.status(404).json({ error: "Container has no IP address" });
      return;
    }
    res.json({
      containerId,
      port,
      containerIP,
      url: `http://localhost:3001/proxy/${containerId}/${port}/`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Container not found or Docker error" });
  }
});

app.use(
  "/proxy/:containerId/:port",
  async (req, res, next) => {
    const { containerId, port } = req.params;
    // Set sticky session cookie
    res.cookie("proxy-target", `${containerId}:${port}`, { path: "/" });

    try {
      const container = docker.getContainer(containerId);

      if (!container) {
        res.status(404).json({ error: "Container not found" });
      }

      const data = await container.inspect();
      const networks = data.NetworkSettings.Networks;
      const containerIP = Object.values(networks)[0]?.IPAddress;
      if (!containerIP) {
        res.status(404).json({ error: "Container has no IP address" });
        return;
      }
      (req as any).proxyTarget = `http://${containerIP}:${port}`;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Container lookup failed" });
    }
  },
  createProxyMiddleware({
    router: (req) => (req as any).proxyTarget,
    changeOrigin: true,
    selfHandleResponse: true,
    on: {
      proxyRes: (proxyRes, req, res) => {
        const { containerId, port } = (req as any).params;
        const contentType = proxyRes.headers["content-type"];

        if (contentType && contentType.includes("text/html")) {
          const bodyChunks: any[] = [];
          proxyRes.on("data", (chunk) => bodyChunks.push(chunk));
          proxyRes.on("end", () => {
            const body = Buffer.concat(bodyChunks).toString();
            const baseTag = `<base href="/proxy/${containerId}/${port}/">`;
            const modifiedBody = body.includes("<head>")
              ? body.replace("<head>", `<head>\n    ${baseTag}`)
              : body.includes("<html>")
                ? body.replace("<html>", `<html>\n<head>${baseTag}</head>`)
                : `${baseTag}${body}`;

            res.setHeader("content-type", "text/html");
            res.setHeader("content-length", Buffer.byteLength(modifiedBody));
            res.status(proxyRes.statusCode || 200).end(modifiedBody);
          });
        } else {
          // Fix: Ensure status and headers are passed through
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(res);
        }
      },
      error: (err, req, res) => {
        console.error("Proxy error:", err.message);
        (res as any)
          .status(502)
          .json({ error: "Bad gateway — container port unreachable" });
      },
    },
  }),
);

// Fallback for requests without /proxy/ prefix (sticky sessions)
app.use(async (req, res, next) => {
  const target = req.cookies["proxy-target"];
  if (target) {
    const [containerId, port] = target.split(":");
    try {
      const container = docker.getContainer(containerId);
      const data = await container.inspect();
      const networks = data.NetworkSettings.Networks;
      const containerIP = Object.values(networks)[0]?.IPAddress;

      if (containerIP) {
        return createProxyMiddleware({
          target: `http://${containerIP}:${port}`,
          changeOrigin: true,
        })(req, res, next);
      }
    } catch (err) {
      // Ignore errors for non-existent containers
    }
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
