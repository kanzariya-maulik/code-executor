import express from "express";
import Docker from "dockerode";
import { createProxyMiddleware } from "http-proxy-middleware";

const docker = new Docker();
const app = express();
const PORT = 3001;

app.use(express.json());

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
    pathRewrite: (path) => {
      const parts = path.split("/");
      return "/" + parts.slice(4).join("/");
    },
    on: {
      error: (err, req, res) => {
        console.error("Proxy error:", err.message);
        (res as any)
          .status(502)
          .json({ error: "Bad gateway — container port unreachable" });
      },
    },
  }),
);

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
