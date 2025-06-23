import { createReadStream } from "node:fs";
import { resolve, isAbsolute } from "node:path";
import { existsSync, statSync } from "node:fs";

export default async (
  rootDirectory: string,
  args: string[]
): Promise<ReadableStream> => {
  if (args.length === 0) {
    throw new Error("cat: missing operand (file path required)");
  }

  const filePath = args[0];

  if (!isAbsolute(filePath)) {
    throw new Error("cat: only absolute paths are supported");
  }

  const resolvedPath = resolve(filePath);

  if (!resolvedPath.startsWith(resolve(rootDirectory))) {
    throw new Error(
      `cat: ${filePath}: Permission denied (outside root directory)`
    );
  }

  if (!existsSync(resolvedPath)) {
    throw new Error(`cat: ${filePath}: No such file or directory`);
  }

  const stats = statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`cat: ${filePath}: Is a directory`);
  }

  try {
    const fileStream = createReadStream(resolvedPath);
    
    // Convert Node.js ReadableStream to Web ReadableStream
    return new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk: string | Buffer) => {
          const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(buffer));
        });
        
        fileStream.on('end', () => {
          controller.close();
        });
        
        fileStream.on('error', (error) => {
          controller.error(error);
        });
      },
      
      cancel() {
        fileStream.destroy();
      }
    });
  } catch (error) {
    throw new Error(
      `cat: ${filePath}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
