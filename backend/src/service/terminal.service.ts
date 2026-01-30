import type { Container } from "dockerode";
import { Duplex } from "stream";

export interface Terminal {
  id: string;
  stream: Duplex;
}

export const terminalService = {
  async create(
    container: Container,
    terminalId: string,
    tty: boolean = true,
  ): Promise<Terminal> {
    const exec = await container.exec({
      Cmd: ["/bin/bash", "-i"],
      User: "sandbox",
      WorkingDir: "/sandbox",
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    const stream = (await exec.start({
      hijack: true,
      stdin: true,
    })) as Duplex;

    return { id: terminalId, stream };
  },

  close(terminal: Terminal): void {
    terminal.stream.end();
  },
};
