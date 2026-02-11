# todo-highlight

A VS Code extension that adds syntax highlighting to `.todo` files.

## Features

Lines are highlighted based on their prefix token, and the highlighting spans multiple lines until the next token — so continuation lines inherit the same background color.

| Prefix | Meaning | Highlight |
|--------|---------|-----------|
| `- `   | Todo (pending task) | Red background |
| `+ `   | Done (completed task) | Green background (faded) |
| `-> `  | Outcome / result | Blue background |
| `--`   | Comment | No highlight |

## Example

```
- Fix the login bug
  This needs to be done before release
  -> Users can now log in
+ Write unit tests
-- This section is done
- Update documentation
```

## Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press `F5` in VS Code to launch the Extension Development Host

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `todoHighlight.doneColor` | Background color for done items | `rgba(130,230,130,0.3)` |
