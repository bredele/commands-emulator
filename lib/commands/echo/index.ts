export const description = "Display text";

export default async (
  _rootDirectory: string,
  args: string[]
): Promise<string> => {
  // Parse arguments to separate flags from text
  const flags = args.filter((arg) => arg.startsWith("-"));
  const textArgs = args.filter((arg) => !arg.startsWith("-"));

  // Check for -n flag (no trailing newline)
  const noNewline = flags.includes("-n");

  // Join all text arguments with spaces
  const text = textArgs.join(" ");

  // Return text with or without trailing newline based on -n flag
  return noNewline ? text : text + "\n";
};
