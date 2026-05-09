const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'filmatch.json'));
const db = low(adapter);

db.defaults({
  library: [],
  quiz_history: [],
  settings: { country: 'AR' },
}).write();

module.exports = db;
