import * as vscode from "vscode";
import { TOKEN_LIST } from "./tokens";

export function cyclePrefix(lineText: string): string {
  const indentMatch = lineText.match(/^([\t ]*)/);
  const indent = indentMatch ? indentMatch[1] : "";
  const rest = lineText.slice(indent.length);

  for (let i = 0; i < TOKEN_LIST.length; i++) {
    if (rest.startsWith(TOKEN_LIST[i])) {
      const next = TOKEN_LIST[(i + 1) % TOKEN_LIST.length];
      return indent + next + rest.slice(TOKEN_LIST[i].length);
    }
  }

  return indent + TOKEN_LIST[0] + rest;
}

export function registerToggleCommand(
  context: vscode.ExtensionContext,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("todoHighlight.toggleState", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith(".todo")) return;

      const selections = editor.selections;
      editor.edit((editBuilder) => {
        for (const sel of selections) {
          const startLine = sel.start.line;
          const endLine = sel.end.line;
          for (let i = startLine; i <= endLine; i++) {
            const line = editor.document.lineAt(i);
            const newText = cyclePrefix(line.text);
            editBuilder.replace(line.range, newText);
          }
        }
      });
    }),
  );
}
