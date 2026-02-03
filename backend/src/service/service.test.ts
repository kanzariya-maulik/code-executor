import { commandService } from "./command.service.js";
import { containerService } from "./container.service.js";
import { fileService } from "./file.service.js";
import { terminalService } from "./terminal.service.js";

async function main() {
  const container = await containerService.create();

  const file1 = await fileService.createFile(container, "", "file1.js");
  const file2 = await fileService.createFile(container, "", "file2.js");

  fileService.updateFile(container, "", "file1.js", "console.log('hello')");
  fileService.updateFile(container, "", "file2.js", "console.log('hello')");

  //add large content to check efficiency
  const largeContent = "a".repeat(1000000);
  fileService.updateFile(container, "", "file1.js", largeContent);

  const tree = await fileService.getTree(container);
  console.log(tree);

  const getFileContent = await fileService.getFileContent(
    container,
    "",
    "file1.js",
  );
  console.log(getFileContent);

  containerService.remove(container);
}

main();
