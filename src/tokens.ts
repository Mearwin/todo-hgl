export const TOKENS = {
  todo: "- ",
  done: "+ ",
  outcome: "-> ",
  comment: "-- ",
} as const;

export const TOKEN_LIST = Object.values(TOKENS);
