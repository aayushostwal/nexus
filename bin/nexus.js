#!/usr/bin/env node
"use strict";

const {
  addTodo,
  install,
  printHelp,
  printShellHook,
  readTodos,
  renderTodos,
  update,
} = require("../scripts/core");

async function main(argv) {
  const [command, ...args] = argv;

  switch (command) {
    case "add": {
      const text = args.join(" ").trim();
      if (!text) {
        throw new Error('Usage: nexus add "Follow up on AWS cost report"');
      }
      const todo = addTodo(text);
      console.log(`Added [${todo.label}] ${todo.text}`);
      break;
    }
    case "todos": {
      const options = {
        color: !args.includes("--no-color"),
        limit: readLimit(args),
      };
      console.log(renderTodos(readTodos(), options));
      break;
    }
    case "install": {
      const result = install({ shellHook: args.includes("--shell-hook") });
      console.log(result.join("\n"));
      break;
    }
    case "update": {
      const result = update();
      console.log(result.join("\n"));
      break;
    }
    case "shell-hook": {
      console.log(printShellHook());
      break;
    }
    case undefined:
    case "help":
    case "--help":
    case "-h": {
      console.log(printHelp());
      break;
    }
    default:
      throw new Error(`Unknown command: ${command}\n\n${printHelp()}`);
  }
}

function readLimit(args) {
  const index = args.indexOf("--limit");
  if (index === -1) return 20;
  const value = Number.parseInt(args[index + 1], 10);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("--limit must be a positive number");
  }
  return value;
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
