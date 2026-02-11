import * as vscode from "vscode";
import { registerToggleCommand } from "./toggleState";
import { TOKENS } from "./tokens";
const { Range, Position } = vscode;

type Decoration = {
  name: string;
  token: string;
  decorationType: vscode.TextEditorDecorationType;
  matches: vscode.Range[];
};

type MatchStart = {
  match: RegExpExecArray;
  pos: vscode.Position;
  line: vscode.TextLine;
};

export function escape(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export function buildRegex(tokens: string[]): RegExp {
  const escaped = tokens.map(escape).join("|");
  return new RegExp(`^([\t ]*(?:--|${escaped}))`, "gm");
}

export function findDecoration(matchGroup: string, tokens: string[]): number {
  return tokens.findIndex((t) => matchGroup.endsWith(t));
}

export function activate(context: vscode.ExtensionContext) {
  let decorations: Decoration[] = [];

  function createDecorations(): Decoration[] {
    const config = vscode.workspace.getConfiguration("todoHighlight");
    const doneColor = config.get<string>("doneColor", "rgba(130,230,130,0.3)");
    const todoColor = config.get<string>("todoColor", "rgba(230,130,130,0.3)");
    const outcomeColor = config.get<string>("outcomeColor", "rgba(130,130,230,0.3)");

    return [
      {
        name: "todo",
        token: TOKENS.todo,
        decorationType: vscode.window.createTextEditorDecorationType({
          backgroundColor: todoColor,
          overviewRulerColor: "red",
          isWholeLine: true,
        }),
        matches: [],
      },
      {
        name: "done",
        token: TOKENS.done,
        decorationType: vscode.window.createTextEditorDecorationType({
          backgroundColor: doneColor,
          overviewRulerColor: "green",
          isWholeLine: true,
          opacity: "0.4",
        }),
        matches: [],
      },
      {
        name: "outcome",
        token: TOKENS.outcome,
        decorationType: vscode.window.createTextEditorDecorationType({
          backgroundColor: outcomeColor,
          overviewRulerColor: "blue",
          isWholeLine: true,
        }),
        matches: [],
      },
    ];
  }

  function disposeDecorations() {
    decorations.forEach((d) => d.decorationType.dispose());
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function debouncedUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => update(), 150);
  }

  decorations = createDecorations();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("todoHighlight")) {
        disposeDecorations();
        decorations = createDecorations();
      }
      debouncedUpdate();
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document === vscode.window.activeTextEditor?.document) {
        debouncedUpdate();
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(() => {
      clearTimeout(debounceTimer);
      update();
    }),
    { dispose: () => clearTimeout(debounceTimer) },
    {
      dispose: () => {
        disposeDecorations();
        decorations = [];
      },
    },
  );

  registerToggleCommand(context);

  update();
  function update() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;
    const fileName = activeEditor.document.fileName;
    if (!fileName.endsWith(".todo")) return;

    decorations.forEach((d) => (d.matches = []));
    const tokens = decorations.map((d) => d.token);
    const regex = buildRegex(tokens);

    const text = activeEditor.document.getText();
    let match: RegExpExecArray | null;
    let start: MatchStart | undefined;

    while ((match = regex.exec(text))) {
      const pos = activeEditor.document.positionAt(match.index);
      const line = activeEditor.document.lineAt(pos);
      addDecoration(start, activeEditor, match);
      start = { match, pos, line };
    }
    addDecoration(start, activeEditor);

    decorations.forEach(({ decorationType, matches }) => {
      activeEditor.setDecorations(decorationType, matches);
    });
  }

  function addDecoration(
    start: MatchStart | undefined,
    activeEditor: vscode.TextEditor,
    match?: RegExpExecArray
  ) {
    if (start) {
      const tokens = decorations.map((d) => d.token);
      const idx = findDecoration(start.match[1], tokens);

      if (idx === -1) return;

      let endPos;
      if (match) {
        endPos = activeEditor.document.positionAt(match.index - 1);
      } else {
        const lastLine = activeEditor.document.lineAt(
          activeEditor.document.lineCount - 1
        );
        endPos = lastLine.range.end;
      }
      const range = new Range(new Position(start.line.lineNumber, 0), endPos);
      decorations[idx].matches.push(range);
    }
  }
}

export function deactivate() {}
