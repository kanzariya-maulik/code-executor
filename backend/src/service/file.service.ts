import type { Container } from "dockerode";
import type { Duplex } from "stream";

export interface FileNode {
  type: "file";
  name: string;
  path: string;
}

export interface DirectoryNode {
  type: "dir";
  name: string;
  children: FileTree;
  path: string;
}

export type FileTreeNode = FileNode | DirectoryNode;
export interface FileTree {
  [name: string]: FileTreeNode;
}

function validate(path: string, name?: string) {
  if (path.includes("..")) throw new Error("Invalid path");
  if (name && name.includes("/")) throw new Error("Invalid name");
}

async function exec(container: Container, cmd: string[]): Promise<string> {
  const exec = await container.exec({
    Cmd: cmd,
    User: "sandbox",
    WorkingDir: "/sandbox",
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
  });

  const stream = (await exec.start({ hijack: true })) as Duplex;

  let stdout = "";
  let stderr = "";

  container.modem.demuxStream(
    stream,
    { write: (c: Buffer) => (stdout += c.toString()) },
    { write: (c: Buffer) => (stderr += c.toString()) },
  );

  await new Promise((res) => stream.on("end", res));
  if (stderr) throw new Error(stderr);
  return stdout.trim();
}

async function buildTree(container: Container, dir: string): Promise<FileTree> {
  const tree: FileTree = {};
  const entries = await exec(container, [
    "bash",
    "-c",
    `find "${dir}" -mindepth 1 -maxdepth 1 -printf "%f\n"`,
  ]);

  if (!entries) return tree;

  for (const name of entries.split("\n")) {
    const full = `${dir}/${name}`;
    const type = await exec(container, [
      "bash",
      "-c",
      `[ -d "${full}" ] && echo dir || echo file`,
    ]);

    if (type === "dir") {
      tree[name] = {
        type: "dir",
        name,
        children: await buildTree(container, full),
        path: full.replace("/sandbox/", ""),
      };
    } else {
      tree[name] = {
        type: "file",
        name,
        path: full.replace("/sandbox/", ""),
      };
    }
  }
  return tree;
}

export const fileService = {
  async getTree(container: Container) {
    return buildTree(container, "/sandbox");
  },

  async createFile(container: Container, path: string, name: string) {
    validate(path, name);
    await exec(container, ["touch", `/sandbox/${path}/${name}`]);
    return true;
  },

  async createFolder(container: Container, path: string, name: string) {
    validate(path, name);
    await exec(container, ["mkdir", "-p", `/sandbox/${path}/${name}`]);
    return true;
  },

  async deleteFile(container: Container, path: string, name: string) {
    validate(path, name);
    await exec(container, ["rm", "-f", `/sandbox/${path}/${name}`]);
    return true;
  },

  async deleteFolder(container: Container, path: string, name: string) {
    validate(path, name);
    await exec(container, ["rm", "-rf", `/sandbox/${path}/${name}`]);
    return true;
  },

  async updateFile(
    container: Container,
    dir: string,
    name: string,
    content: string,
  ) {
    validate(dir, name);

    const exec = await container.exec({
      Cmd: ["bash", "-c", `cat > /sandbox/${dir}`],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true });

    stream.write(content);
    stream.end();

    return true;
  },

  async getFileContent(container: Container, dir: string, name: string) {
    validate(dir, name);

    const exec = await container.exec({
      Cmd: ["bash", "-c", `cat /sandbox/${dir}`],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true });

    let stdout = "";
    let stderr = "";

    container.modem.demuxStream(
      stream,
      { write: (c: Buffer) => (stdout += c.toString()) },
      { write: (c: Buffer) => (stderr += c.toString()) },
    );

    await new Promise((res) => stream.on("end", res));
    if (stderr) throw new Error(stderr);
    return stdout.trim();
  },
};
