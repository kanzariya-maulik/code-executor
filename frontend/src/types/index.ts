interface FileNode {
  type: "file";
  name: string;
  path: string;
}

interface DirectoryNode {
  type: "dir";
  name: string;
  children: FileTree;
  path: string;
}

type FileTreeNode = FileNode | DirectoryNode;

interface FileTree {
  [name: string]: FileTreeNode;
}

export type { FileNode, DirectoryNode, FileTreeNode, FileTree };