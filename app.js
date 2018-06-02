process.env.TZ = 'Europe/Madrid'
const express = require('express');
const app = express();
const routes = require('./routes');
const run_job = require('./run_job');
var chokidar = require('chokidar')
var watcher = chokidar.watch('/home/pi/project')

app.use('/', routes);

app.use((err, req, res, next) => {
  res.sendStatus(err.status || 500);
});

const server = app.listen(3000, () => console.info('listening on port 3000!'));

function reloadDependencies(path) {
  if (path.indexOf('.js') > -1 && path.indexOf('node_modules') === -1) {
    console.log('Updating require dependencies')
    server.close()
    run_job.stop()
    process.exit(0)
  }
}

watcher.on('ready', () => {
  watcher.on('add', reloadDependencies)
  watcher.on('change', reloadDependencies)
})
