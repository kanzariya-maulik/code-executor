import express from "express";
import execRoute from "./routes/exec.route.js";
import { spawn } from "child_process";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/", execRoute);

//check docker is available
spawn("docker", ["--version"]).on("close", (code) => {
  if (code !== 0) {
    console.log("Docker is not available");
    process.exit(1);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});