const { Transform } = require("stream");
const { SEPARATORS } = require("./constants");
const { toColumnName, determineMost } = require("./helpers");

class csvToJson extends Transform {
  constructor(separator) {
    super();
    this.separator = separator;
    this.cutedLine = "";
    this.isFirstTransform = true;
  }

  autoDetectSeparator(chunk) {
    let lines = chunk.split("\r");

    return determineMost(lines[0], SEPARATORS);
  }

  getFullLines(chunk) {
    let fullChunk = this.cutedLine + chunk.toString();

    if (!this.separator) {
      this.separator = this.autoDetectSeparator(fullChunk);
    }

    let lines = fullChunk.split("\r").map(line => line.split(this.separator));

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

    return lines;
  }

  parseLines(lines) {
    return lines.map(line => {
      const lineObj = {};
      line.forEach((field, index) => {
        lineObj[toColumnName(index + 1)] = field;
      });
      return lineObj;
    });
  }

  _flush(callback) {
    this.push("]}");
    callback();
  }

  _transform(chunk, encoding, callback) {
    const fullLines = this.getFullLines(chunk);

    const parsedLines = this.parseLines(fullLines);

    this.push(
      (this.isFirstTransform ? '{"data": [' : ",") +
        JSON.stringify(parsedLines).slice(1, -1)
    );
    if (this.isFirstTransform) {
      this.isFirstTransform = false;
    }
    callback();
  }
}

class jsonToCsv extends Transform {
  constructor(separator) {
    super();
    this.separator = separator;
    this.cutedLine = "";
    this.isFirstTransform = true;
  }

  getObjectsString(chunk) {
    let objectsStr = this.cutedLine + chunk.toString();

    const arrayStartIndex = objectsStr.indexOf("[");
    if (arrayStartIndex >= 0) {
      objectsStr = objectsStr.slice(arrayStartIndex + 1);
    }

    const arrayEndIndex = objectsStr.indexOf("]");
    if (arrayEndIndex >= 0) {
      objectsStr = objectsStr.slice(0, arrayEndIndex);
    }

    return objectsStr;
  }

  getFullObjects(objectsStr) {
    let fullObjectsStr = objectsStr;
    const lastOpenObjIndex = fullObjectsStr.lastIndexOf("{");
    const lastCloseObjIndex = fullObjectsStr.lastIndexOf("}");

    if (lastOpenObjIndex > lastCloseObjIndex) {
      this.cutedLine = fullObjectsStr.slice(lastOpenObjIndex);
      fullObjectsStr = fullObjectsStr.slice(0, lastCloseObjIndex + 1);
    } else {
      this.cutedLine = "";
      fullObjectsStr = fullObjectsStr.slice(0, lastCloseObjIndex + 1);
    }

    return JSON.parse("[" + fullObjectsStr.replace(/(^,)|(,$)/g, "") + "]");
  }

  parseObjects(objects) {
    let parsedObjects = "";
    objects.forEach(obj => {
      let objLine = "";
      for (let key in obj) {
        if (objLine != "") objLine += this.separator;

        objLine += obj[key];
      }

      parsedObjects += objLine + "\r";
    });

    return parsedObjects;
  }

  _transform(chunk, encoding, callback) {
    try {
      const objectsStr = this.getObjectsString(chunk);
      const fullObjects = this.getFullObjects(objectsStr);
      const parsedObjects = this.parseObjects(fullObjects);

      this.push(parsedObjects);
      callback();
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = {
  csvToJson,
  jsonToCsv
};
