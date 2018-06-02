process.env.TZ = 'Europe/Madrid'
const express = require('express');
const app = express();
const routes = require('./routes');
const run_job = require('./run_job');

app.use('/', routes);

app.use((err, req, res, next) => {
  res.sendStatus(err.status || 500);
});

app.listen(3000, () => console.info('listening on port 3000!'));
