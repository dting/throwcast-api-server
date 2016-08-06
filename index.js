const db = require('./db');
const server = require('./server');

db.on('error', console.error.bind(console, 'connection error:')); // eslint-disable-line no-console
db.once('open', server.start);
