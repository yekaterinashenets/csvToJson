#!/usr/bin/env node

const fs = require("fs");
const { commands } = require("./constants");
const { getCommands, errorLog } = require("./helpers");
const { jsonToCsv } = require("./transforms");

const convertJsonToCsv = (sourceFile, resultFile, separator = ",") => {
  const rs = fs.createReadStream(sourceFile);
  const ws = fs.createWriteStream(resultFile, { flags: "a" });
  const ts = new jsonToCsv(separator);
  rs.pipe(ts)
    .pipe(ws)
    .on("finish", err => {
      !err && console.log("Parsing successfully finished");
    })
    .on("error", errorLog);
};

const initApp = () => {
  const enteredCommands = getCommands();

  const sourceFile = enteredCommands[commands.SOURCE_FILE];
  const resultFile = enteredCommands[commands.RESULT_FILE];
  const separator = enteredCommands[commands.SEPARATOR];

  if (sourceFile && resultFile) {
    convertJsonToCsv(sourceFile, resultFile, separator);
  } else {
    console.log("sourceFile and resultFile arguments are required");
  }
};

initApp();
