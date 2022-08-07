import * as vscode from "vscode";
const { Range, Position } = vscode;

let decorations = [
  {
    name: "todo",
    token: "- ",
    decorationType: vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgb(230, 130, 130, 0.3)",
      overviewRulerColor: "red",
      isWholeLine: true,
    }),
    matchs: new Array(),
  },
  {
    name: "done",
    token: "+ ",
    decorationType: vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgb(130,230,130, 0.3)",
      overviewRulerColor: "green",
      isWholeLine: true,
      opacity: "0.4",
    }),
    matchs: new Array(),
  },
  {
    name: "outcome",
    token: "-> ",
    decorationType: vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgb(130, 130, 230, 0.3)",
      overviewRulerColor: "blue",
      isWholeLine: true,
    }),
    matchs: new Array(),
  },
];

function escape(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
const tokens = decorations
  .map((d) => d.token)
  .map(escape)
  .join("|");
var regex = new RegExp(`^([\t ]*(?:--|${tokens}))`, "gm");

export function activate(context: vscode.ExtensionContext) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) return;

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(() => update()),
    vscode.workspace.onDidChangeTextDocument(() => update()),
    vscode.window.onDidChangeActiveTextEditor(() => update())
  );

  update();
  function update() {
    vscode.window.showInformationMessage("Update !");
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;
    const fileName = activeEditor.document.fileName;
    if (!fileName.endsWith(".todo")) return;

    decorations.forEach((d) => (d.matchs = []));

    var text = activeEditor.document.getText();
    let match, start;

    while ((match = regex.exec(text))) {
      const pos = activeEditor.document.positionAt(match.index);
      const line = activeEditor.document.lineAt(pos);
      addDecoration(start, match, activeEditor);
      start = { match, pos, line };
    }
    if (match) addDecoration(start, match, activeEditor);

    if (!activeEditor) return;

    Object.entries(decorations).forEach(([, { decorationType, matchs }]) => {
      activeEditor.setDecorations(decorationType, matchs);
    });
  }

  function addDecoration(
    start: any,
    match: RegExpExecArray,
    activeEditor: vscode.TextEditor
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
      decoration.matchs.push(range);
    }
  }
}
