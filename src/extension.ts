import * as vscode from "vscode";
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

export function activate(context: vscode.ExtensionContext) {
  let decorations: Decoration[] = [];

  function createDecorations(): Decoration[] {
    const config = vscode.workspace.getConfiguration("todoHighlight");
    const doneColor = config.get<string>("doneColor", "rgba(130,230,130,0.3)");

    return [
      {
        name: "todo",
        token: "- ",
        decorationType: vscode.window.createTextEditorDecorationType({
          backgroundColor: "rgb(230, 130, 130, 0.3)",
          overviewRulerColor: "red",
          isWholeLine: true,
        }),
        matches: [],
      },
      {
        name: "done",
        token: "+ ",
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
        token: "-> ",
        decorationType: vscode.window.createTextEditorDecorationType({
          backgroundColor: "rgb(130, 130, 230, 0.3)",
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

  function escape(text: string) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  function buildRegex() {
    const tokens = decorations
      .map((d) => d.token)
      .map(escape)
      .join("|");
    return new RegExp(`^([\t ]*(?:--|${tokens}))`, "gm");
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) return;

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

  update();
  function update() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;
    const fileName = activeEditor.document.fileName;
    if (!fileName.endsWith(".todo")) return;

    decorations.forEach((d) => (d.matches = []));
    const regex = buildRegex();

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
      const decoration = decorations.find((d) => {
        return start.match[1].includes(d.token);
      });

      if (!decoration) return;

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
      decoration.matches.push(range);
    }
  }
}

export function deactivate() {}
