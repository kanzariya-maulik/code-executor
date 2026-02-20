import Docker, { type Container } from "dockerode";

const docker = new Docker();

async function waitForExec(exec: Docker.Exec): Promise<void> {
  const stream = await exec.start({ hijack: true, stdin: false });
  await new Promise<void>((res, rej) => {
    stream.on("end", res);
    stream.on("error", rej);
  });
}

export const containerService = {
  async create(): Promise<Container> {
    try {
      const container = await docker.createContainer({
        Image: "code-runner-env",
        Cmd: ["/bin/bash"],
        Tty: true,
        OpenStdin: true,
        User: "root",

        Env: ["HOME=/home/sandbox", "TERM=xterm-256color"],

        HostConfig: {
          Memory: 512 * 1024 * 1024,
          NanoCpus: 1e9,
          PidsLimit: 64,
          NetworkMode: "sandbox-net",
          AutoRemove: false,
        },
      });

      await container.start();

      const exec = await container.exec({
        Cmd: [
          "bash",
          "-c",
          `
        id sandbox 2>/dev/null || useradd -m sandbox
        mkdir -p /sandbox
        chown -R sandbox:sandbox /sandbox
        echo 'cd /sandbox' >> /home/sandbox/.bashrc
        `,
        ],
        User: "root",
        AttachStdout: true,
        AttachStderr: true,
      });

      await waitForExec(exec);
      return container;
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
  },

  async remove(container: Container) {
    try {
      await container.stop();
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
    await container.remove({ force: true });
  },

  async ping() {
    return await docker.ping();
  },
};
