#!/usr/bin/env node

const fs = require("fs");
const { commands } = require("./constants");
const { getCommands, errorLog } = require("./helpers");
const { csvToJson } = require("./transforms");

const generateSampleCsv = linesCount => {
  try {
    const ws = fs.createWriteStream("./sample.csv", { flags: "a" });
    for (let i = 0; i < linesCount; i++) {
      ws.write(
        `${i +
          1},Newell 335,Don Miller,1540,5.76,2.88,0.7,Nunavut,Pens & Art Supplies,0.56\r`
      );
    }
  } catch (err) {
    console.log(err);
  }
};

const convertCsvToJson = (sourceFile, resultFile, separator = null) => {
  // fs.writeFileSync(resultFile, '{"data": [');
  const rs = fs.createReadStream(sourceFile);
  const ws = fs.createWriteStream(resultFile, { flags: "a" });
  const ts = new csvToJson(separator);
  rs.pipe(ts)
    .pipe(ws)
    .on("finish", err => {
      if (!err) {
        // fs.appendFile(resultFile, "]}", errorLog);
        console.log("Parsing successfully finished");
      }
    })
    .on("error", errorLog);
};

const initApp = () => {
  const enteredCommands = getCommands();

  const sourceFile = enteredCommands[commands.SOURCE_FILE];
  const resultFile = enteredCommands[commands.RESULT_FILE];
  const separator = enteredCommands[commands.SEPARATOR];

  const linesCountToGenerate = enteredCommands[commands.GENERATE_CSV];

  if (sourceFile && resultFile) {
    return convertCsvToJson(sourceFile, resultFile, separator);
  }
  if (linesCountToGenerate) {
    return generateSampleCsv(linesCountToGenerate);
  }

  return errorLog("Entered command is not valid");
};

initApp();
