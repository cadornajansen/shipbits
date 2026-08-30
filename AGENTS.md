<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Repository exploration

Minimize context and tool output.

- Search before reading: use grep/glob/LSP first.
- Never recursively dump the repository.
- Read only files likely relevant to the task.
- For large files, read only relevant line ranges.
- Do not reread unchanged files unless necessary.
- Prefer LSP definition/references over manually searching dependencies.
- Stop exploration once enough evidence exists to implement.
- Delegate broad read-only discovery to the Explore subagent.
- Return file paths + concise findings from exploration, not full files.

## Editing

- Prefer precise edit/apply_patch operations.
- Do not rewrite whole existing files for small changes.
- Preserve unrelated code.
- Run targeted checks before full-suite checks.
- Summarize large command outputs instead of reproducing them.

<!-- END:nextjs-agent-rules -->
