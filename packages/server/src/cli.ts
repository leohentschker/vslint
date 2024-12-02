#!/usr/bin/env node
import { startServer } from "./server";
import { runDesignEvals } from "./evaluate";

const args = process.argv.slice(2);

if (args[0] === "eval") {
  runDesignEvals();
} else {
  startServer();
}
