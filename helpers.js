const getCommands = () => {
  const args = process.argv.slice(2);
  const enteredCommands = {};

  for (let i = 0; i < args.length; i += 2) {
    enteredCommands[args[i]] = args[i + 1];
  }

  return enteredCommands;
};

const determineMost = (chunk, items) => {
  const itemCount = {};
  let ignoreString = false;
  let maxValue = 0;
  let maxChar;
  let currValue;

  items.forEach(function(item) {
    itemCount[item] = 0;
  });

  for (let i = 0; i < chunk.length; i++) {
    if (chunk[i] === '"') ignoreString = !ignoreString;
    else if (!ignoreString && chunk[i] in itemCount) {
      currValue = ++itemCount[chunk[i]];
      if (currValue > maxValue) {
        maxValue = currValue;
        maxChar = chunk[i];
      }
    }
  }
  return maxChar;
};

const toColumnName = colNum => {
  let res;
  for (res = "", a = 1, z = 26; (colNum -= a) >= 0; a = z, z *= 26) {
    res = String.fromCharCode(parseInt((colNum % z) / a) + 65) + res;
  }
  return res;
};

const errorLog = err => err && console.error(err);

module.exports = {
  getCommands,
  determineMost,
  toColumnName,
  errorLog
};
