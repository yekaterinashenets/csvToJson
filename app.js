#!/usr/bin/env node

const fs = require("fs");
const { Transform } = require("stream");
const { commands } = require("./constants");
const { errorLog, autoDetectSeparator, toColumnName } = require("./helpers");

class csvToJson extends Transform {
  constructor(separator) {
    super();
    this.separator = separator;
    this.cutedLine = "";
    this.isFirstTransform = true;
  }

  _transform(chunk, encoding, callback) {
    let fullChunk = this.cutedLine + chunk.toString();

    const detectedSeparator = this.separator || autoDetectSeparator(fullChunk);

    let lines = fullChunk
      .split("\r")
      .map(line => line.split(detectedSeparator));

    const lastLineSeparatorIndex = fullChunk.lastIndexOf("\r");
    if (
      lastLineSeparatorIndex >= 0 &&
      lastLineSeparatorIndex !== fullChunk.length - 1
    ) {
      this.cutedLine = fullChunk.slice(lastLineSeparatorIndex + 1);
      lines.pop();
    } else if (lastLineSeparatorIndex < 0) {
      this.cutedLine = fullChunk;
      lines = [];
    } else {
      this.cutedLine = "";
    }

    const parsedLines = lines.map(line => {
      const lineObj = {};
      line.forEach((field, index) => {
        lineObj[toColumnName(index + 1)] = field;
      });
      return lineObj;
    });
    this.push(
      (this.isFirstTransform ? "" : ",") +
        JSON.stringify(parsedLines).slice(1, -1)
    );
    if (this.isFirstTransform) {
      this.isFirstTransform = false;
    }
    callback();
  }
}

// const testWriteFunc = async () => {
//   try {
//     const writeableStream = fs.createWriteStream("./small.csv", { flags: "a" });
//     for (let i = 0; i < 20000; i++) {
//       writeableStream.write(
//         `${i +
//           1},Newell 335,Don Miller,1540,5.76,2.88,0.7,Nunavut,Pens & Art Supplies,0.56\r`
//       );
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

// const testReadFunc = async () => {
//   try {
//     const readedJson = fs.readFileSync("./test.json", "utf-8");
//     console.log(JSON.parse(readedJson));
//   } catch (err) {
//     console.log(err);
//   }
// };

const convertCsvToJson = (sourceFile, resultFile, separator = null) => {
  fs.writeFileSync(resultFile, '{"data": [');
  const rs = fs.createReadStream(sourceFile);
  const ws = fs.createWriteStream(resultFile, { flags: "a" });
  const ts = new csvToJson(separator);
  rs.pipe(ts)
    .pipe(ws)
    .on("finish", (err, data) => {
      fs.appendFile(resultFile, "]}", errorLog);
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
    convertCsvToJson(sourceFile, resultFile, separator);
  } else {
    console.log("sourceFile and resultFile arguments are required");
  }
};

initApp();
