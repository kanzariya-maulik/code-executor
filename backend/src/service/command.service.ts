import type { Duplex } from "stream";

export const commandService = {
  executeCommandStream(
    terminal: Duplex,
    command: string,
    callback: (chunk: string) => void,
  ) {
    const marker = `__END_${Date.now()}__`;
    let ended = false;

    terminal.removeAllListeners("data");

    const onData = (data: Buffer) => {
      if (ended) return;

      const str = data.toString();

      if (str.includes(marker)) {
        const clean = str.split(marker)[0];
        if (clean) callback(clean);

        ended = true;
        terminal.off("data", onData);
        return;
      }

      callback(str);
    };

    terminal.on("data", onData);

    terminal.on("error", (err) => {
      if (!ended) {
        ended = true;
        terminal.off("data", onData);
      }
      console.error("Terminal error:", err);
    });

    terminal.write(`set +o histexpand; ${command}; echo ${marker}\n`);
  },

  executeCommand(terminal: Duplex, command: string) {
    terminal.write(command);
  },
};
