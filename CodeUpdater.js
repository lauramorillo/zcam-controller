const simpleGit = require('simple-git/promise')('/home/pi/project');

class CodeUpdater {
  constructor(tracer) {
    this.tracer = tracer
  }

  async updateCode() {
    this.tracer.log('Updating code')
    return simpleGit.pull('origin', 'master', {'--no-rebase': null})
  }
}

module.exports = CodeUpdater