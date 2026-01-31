import { commandService } from "./command.service.js";
import { containerService } from "./container.service.js";
import { terminalService } from "./terminal.service.js";

async function main() {
  const container = await containerService.create();

  const terminal = terminalService.create(container, "1");
}

main();
