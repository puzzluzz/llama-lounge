// Lint for real mistakes only (misspelled names, duplicate keys, unreachable code), not style.
import globals from "globals";
const rules = { "no-undef": "error", "no-dupe-keys": "error", "no-dupe-args": "error", "no-const-assign": "error", "no-unreachable": "error", "no-dupe-class-members": "error", "no-func-assign": "error", "no-import-assign": "error", "no-obj-calls": "error", "no-unsafe-negation": "error", "use-isnan": "error", "valid-typeof": "error", "no-self-assign": "error", "no-dupe-else-if": "error", "no-duplicate-case": "error", "getter-return": "error", "no-setter-return": "error", "no-this-before-super": "error", "constructor-super": "error" };
export default [
  { files: ["public/js/*.js"], languageOptions: { ecmaVersion: 2024, sourceType: "script", globals: { ...globals.browser, NET: "writable", GAME_VERSION: "readonly", apiPost: "readonly" } }, linterOptions: { reportUnusedDisableDirectives: "off" }, rules },
  { files: ["src/*.js"], languageOptions: { ecmaVersion: 2024, sourceType: "module", globals: { ...globals.serviceworker, WebSocketPair: "readonly", WebSocketRequestResponsePair: "readonly" } }, rules },
  { files: ["tests/*.mjs"], languageOptions: { ecmaVersion: 2024, sourceType: "module", globals: { ...globals.node } }, rules },
];
