#!/usr/bin/env node

const fs = require("fs");
const { Transform } = require("stream");
const { commands } = require("./constants");
const { errorLog } = require("./helpers");

class jsonToCsv extends Transform {
  constructor(separator) {
    super();
    this.separator = separator;
    this.cutedLine = "";
    this.isFirstTransform = true;
  }

  _transform(chunk, encoding, callback) {
    try {
      let fullChunk = this.cutedLine + chunk.toString();

      let a = chunk.toString();

      const arrayStartIndex = fullChunk.indexOf("[");
      if (arrayStartIndex >= 0) {
        fullChunk = fullChunk.slice(arrayStartIndex + 1);
      }

      const arrayEndIndex = fullChunk.indexOf("]");
      if (arrayEndIndex >= 0) {
        fullChunk = fullChunk.slice(0, arrayEndIndex);
      }

      const lastOpenObjIndex = fullChunk.lastIndexOf("{");
      const lastCloseObjIndex = fullChunk.lastIndexOf("}");

      if (lastOpenObjIndex > lastCloseObjIndex) {
        this.cutedLine = fullChunk.slice(lastOpenObjIndex);
        fullChunk = fullChunk.slice(0, lastCloseObjIndex + 1);
      } else {
        this.cutedLine = "";
        fullChunk = fullChunk.slice(0, lastCloseObjIndex + 1);
      }

      const lines = JSON.parse("[" + fullChunk.replace(/(^,)|(,$)/g, "") + "]");

      let parsedLines = "";
      lines.forEach((line, i) => {
        let lineStr = "";
        for (let key in line) {
          if (lineStr != "") lineStr += this.separator;

          lineStr += line[key];
        }

        parsedLines += lineStr + "\r";
      });

      this.push(parsedLines);
      callback();
    } catch (err) {
      console.log(err);
    }
  }
}

const convertJsonToCsv = (sourceFile, resultFile, separator = ",") => {
  const rs = fs.createReadStream(sourceFile);
  const ws = fs.createWriteStream(resultFile, { flags: "a" });
  const ts = new jsonToCsv(separator);
  rs.pipe(ts)
    .pipe(ws)
    .on("finish", (err, data) => {
      console.log("Parsing successfully finished");
    })
    .on("error", errorLog);
};

const initApp = () => {
  const args = process.argv.slice(2);
  const enteredCommands = {};

  for (let i = 0; i < args.length; i += 2) {
    enteredCommands[args[i]] = args[i + 1];
  }

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
