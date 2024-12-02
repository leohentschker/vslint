#!/usr/bin/env node
import { runDesignEvals } from "./evaluate";
import { startServer } from "./server";

const args = process.argv.slice(2);

if (args[0] === "eval") {
  runDesignEvals();
} else {
  startServer();
}
