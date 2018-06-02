const DriveConnector = require('./DriveConnector')
const CamConnector = require('./CamConnector')
const LocalConnector = require('./LocalConnector')
const Config = require('./Config')
const Tracer = require('./Tracer')
const CodeUpdater = require('./CodeUpdater')

const tracer = new Tracer()
const localConnector = new LocalConnector(tracer)
const driveConnector = new DriveConnector(tracer, localConnector)
const codeUpdater = new CodeUpdater(tracer)

const camConnector = new CamConnector(tracer)
const schedule = require('node-schedule');
const fs = require('fs')
const moment = require('moment')

const DAYS_MAPPING = {"l": 1, "m": 2, "x": 3, "j": 4, "v":5, "s":6, "d": 0}
const CONFIG_RELOAD_TIME = 24*60*60*1000

let job = null
let dailyJob = null
let codeUpdateJob = null

let previousConfig = null

function cancelJobs() {
  if (job) job.cancel()
  if (dailyJob) dailyJob.cancel()
}

function cronFromConfig(config) {
  const frequency = config.frequency
  const cronFrequency = parseInt(frequency) > 0 ? `*/${frequency}` : 0
  let hours = '*'
  let daysOfWeek = '*'
  if (config.startHour && config.endHour) 
    hours = `${config.startHour}-${config.endHour}`
  if (config.daysOfWeek) {
    daysOfWeek = config.daysOfWeek.split(',').map(d => DAYS_MAPPING[d]).join(',')
  }
  return `0 ${cronFrequency} ${hours} * * ${daysOfWeek}`
}

async function processPhoto(config) {
  const localDir = await localConnector.createDailyDir(config)
  const pictureCameraPath = await camConnector.takePhoto()
  const rawEnabled = config.rawEnabled
  await camConnector.downloadFile(pictureCameraPath, rawEnabled, localDir)
  await camConnector.deleteFile(pictureCameraPath)
  await driveConnector.uploadFiles(localConnector.photos_dir)
}

async function processDailyPhoto(config) {
  const localDir = await localConnector.createDailyDir(config)
  const pictureCameraPath = await camConnector.takePhoto()
  const filePath = await camConnector.downloadFile(pictureCameraPath, false, localDir)
  await camConnector.deleteFile(pictureCameraPath)
  await driveConnector.uploadDailyFile(filePath, config)
}

async function loadConfig() {
  try {
    tracer.log('Loading config')
    const config = await Config.getConfig(driveConnector)
    tracer.log('Config loaded')
    if (!job || !previousConfig || config.stringify() !== previousConfig.stringify()) {
      console.log('Updating job with cron ', cronFromConfig(config), ' at ', new Date())
      if (job) job.cancel()
      if (dailyJob) dailyJob.cancel()
      
      job = schedule.scheduleJob(cronFromConfig(config), () => {
        tracer.log(`Executing job at ${new Date()}`)
        try {
          processPhoto(config)
        } catch(err) {
          tracer.log('Error processing photo')
          tracer.error(err)
        }
      });

      if (config.dailyEnabled) {
        dailyJob = schedule.scheduleJob('26 0 * * 0-6', () => {
          tracer.log(`Executing daily job at ${new Date()}`)
          try {
            processDailyPhoto(config)
          } catch(err) {
            tracer.log('Error processing daily photo')
            tracer.error(err)
          }
        })
      }

      if (config.codeUpdateJob) {
        codeUpdater.updateCode()
      }

      previousConfig = new Config(config._config)
    }
  } catch(err) {
    console.error(err)
  }
}

configJob = schedule.scheduleJob('*/5 * * * *', () => {
  loadConfig()
});
loadConfig()

module.exports.stop = () => {
  cancelJobs()
}