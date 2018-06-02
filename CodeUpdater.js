const simpleGit = require('simple-git')('/home/pi/project');

class CodeUpdater {
  constructor(tracer) {
    this.tracer = tracer
  }

  async updateCode() {
    this.tracer.log('Updating code')
    await simpeGit.pull('origin', 'master', {'--no-rebase': null})
  }
}

module.exports = CodeUpdater