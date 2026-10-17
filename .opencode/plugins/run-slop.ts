import { Plugin } from "@opencode/plugin";
import { execFile } from "node:child_process";

export default Plugin.define({
  id: "sloperator.run-slop",
  setup: async (ctx) => {
    // Resolve once per setup; project canonical is the repo root.
    const projectRoot = ctx.location.project.canonical ?? ctx.location.directory;

    await ctx.tool.transform((tools) => {
      tools.add({
        name: "run_slop",
        description: "Run a .slop file with the Sloperator interpreter and return its result",
        input: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the .slop file to run, relative to the project root or absolute",
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
        output: {
          type: "object",
          properties: {
            stdout: { type: "string" },
            stderr: { type: "string" },
            exitCode: { type: "number" },
          },
          required: ["stdout", "stderr", "exitCode"],
          additionalProperties: false,
        },
        options: { codemode: false },
        execute: async (input, context) => {
          const { path } = input as { path: string };
          const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
            (resolve, reject) => {
              execFile(
                "uv",
                ["run", "--no-active", "sloperator.py", path],
                { cwd: projectRoot, encoding: "utf-8", signal: context.signal },
                (error, stdout, stderr) => {
                  if (error) {
                    // Non-zero exits still produce a result; only fail when the
                    // process could not be spawned at all (no exit code).
                    const exitCode =
                      typeof (error as NodeJS.ErrnoException & { code?: unknown }).code === "number"
                        ? ((error as { code: number }).code)
                        : undefined;
                    if (exitCode === undefined) {
                      reject(error);
                      return;
                    }
                    resolve({ stdout, stderr, exitCode });
                    return;
                  }
                  resolve({ stdout, stderr, exitCode: 0 });
                },
              );
            },
          );
          return {
            output: result,
            content: JSON.stringify(result, null, 2),
          };
        },
      });
    });
  },
});
