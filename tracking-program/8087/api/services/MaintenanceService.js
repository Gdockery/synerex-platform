const { readFileSync, writeFileSync, createWriteStream, createReadStream } = require('fs')
const { spawn, execSync } = require('child_process')
const request = require('request')


/* NOTE !!! STATUS_FILE file is used in the update.sh script */
const STATUS_FILE = '/tmp/xeco-update-status'
const UPDATE_SCRIPT = '/vagrant/update.sh'

// ONLY FOR TESTING
// const TEST_REMOTE = '/tmp/test-remote'
// const TEST_SOURCE = '/tmp/test-source'

/**
 * @typedef {string} StateValue
 */

/**
 * @enum {StateValue}
 */
const State = {
  Ready: 'Ready',
  Updating: 'Updating',
  RollingBack: 'RollingBack',
  Error: 'Error'
}

/**
 * @typedef {Object} BasicStatus
 * @property {string} name
 * @property {StateValue} state
 * @property {string} nodeVersion
 * @property {string} lastCommits
 */

/**
 * @typedef {Object} Status
 * @property {BasicStatus} local
 * @property {Object.<string, BasicStatus>} remote
 */

const DEFAULT_STATUS = {
  local: {
    name: require('os').hostname(),
    state: State.Ready,
    nodeVersion: nodeVersion(),
    lastCommits: lastCommitsInfo()
  },
  remote: {}
}

/**
 * @type Status
 */
let status

function getStatus(host) {
  let dict

  refreshStatus()

  if (host == 'local') {
    dict = status.local
  } else {
    if (!status.remote[host]) {
      status.remote[host] = {}
    }
    dict = status.remote[host]
  }

  return dict
}

function updateStatus(host, props) {
  let dict

  refreshStatus()

  if (host == 'local') {
    dict = status.local
  } else {
    if (!status.remote[host]) {
      status.remote[host] = {}
    }
    dict = status.remote[host]
  }

  for (let key in props) {
    if (props[key] === undefined) {
      delete dict[key]
    } else {
      dict[key] = props[key]
    }
  }

  writeFileSync(STATUS_FILE, JSON.stringify(status))
}

function refreshStatus() {
  try {
    status = JSON.parse(readFileSync(STATUS_FILE))
  } catch (e) {
    status = JSON.parse(JSON.stringify(DEFAULT_STATUS))
  }
}

function lastCommitsInfo() {
  return shellDoNow('git log -3').toString()
}

function nodeVersion() {
  return shellDoNow('node -v').toString()
}

function applyUpdate(packPath, targetFolder) {
  return shellDo(UPDATE_SCRIPT, ['request-apply', packPath, targetFolder])
}

function rollbackUpdate(targetFolder) {
  return shellDo(UPDATE_SCRIPT, ['request-rollback', targetFolder])
}

function encrypt(message) {
  return shellDoNow(UPDATE_SCRIPT + ' encrypt', message)
}

function decrypt(message) {
  return shellDoNow(UPDATE_SCRIPT + ' decrypt', message)
}

/**
 * @param {string} listingFile The path of the resulting listing file
 * @param {string} customFolder Optional. Defaults to /vagrant
 */
function listFiles(listingFile, customFolder) {
  return shellDo(UPDATE_SCRIPT, ['list-files', listingFile, customFolder])
}

function pack(file, packFile) {
  return shellDo(UPDATE_SCRIPT, ['pack', file, packFile])
}

function packList(fileList, packFile) {
  return shellDo(UPDATE_SCRIPT, ['pack-list', fileList, packFile])
}

/**
 * @param {string} packFile The path to the encrypted archive
 * @param {string} targetFolder Optional. Defaults to parent of packFile
 * @returns {Promise}
 */
function unpack(packFile, targetFolder) {
  return shellDo(UPDATE_SCRIPT, ['unpack', packFile, targetFolder])
}

/**
 * @param {string} packPath Where to put the pack file
 * @param {string} customFolder Optional. Defaults to '/vagrant'
 * @returns {Promise<string>} Promise of the path of the pack file
 */
function createFileListPack(packPath, customFolder) {
  return new Promise((resolve, reject) => {
    let temp = newTemp('file-list')
    let listPath = temp.path + '/list'

    listFiles(listPath, customFolder)
      .then(() => pack(listPath, packPath)
        .then(() => {
          temp.cleanup()
          resolve(packPath)
        })
      )
      .catch(reject)
  })
}

function parseFileList(listPath) {
  let lines = readFileSync(listPath).toString().split('\n'),
    match, type, folders = [], files = [], checksums = [],
    checksum, file

  for (let line of lines) {
    if(!line) {
      continue
    }

    if (line.startsWith('--- ') && (match = line.match(/--- (.*) ---/))) {
      type = match[1]
      continue
    }
    
    if (type == 'folders') {
      folders.push(line)
      continue
    }

    [checksum, file] = line.split('\t')

    if(!checksum || !file) {
      continue
    }

    files.push(file)
    checksums.push(checksum)
  }

  return FileListDiffService.itemList(folders, files, checksums)
}

function createUpdate(localList, remoteList, outputFile) {
  let temp = newTemp('update-package')
  let fileList = temp.path + '/fileList'

  return new Promise((resolve, reject) => {
    let diffList = FileListDiffService.diffList(
      parseFileList(localList),
      parseFileList(remoteList)
    )

    writeFileSync(temp.path + '/.newFolders',
      diffList['send']['folder'].join('\n'))

    writeFileSync(temp.path + '/.oldFolders',
      diffList['delete']['folder'].join('\n'))

    writeFileSync(temp.path + '/.oldFiles',
      diffList['delete']['file'].join('\n'))

    writeFileSync(fileList, [
      '-C ' + temp.path,
      '.oldFiles',
      '.oldFolders',
      '.newFolders',
      '-C ' + '/vagrant'
    ].concat(
      diffList['send']['file']
    ).join('\n'))

    packList(fileList, outputFile)
      .then(() => {
        temp.cleanup()
        resolve(outputFile)
      })
      .catch(reject)
  })

}


class RemoteHost {
  constructor(host, secret) {
    Object.assign(this, { host, secret })
  }

  setStatus(data) {
    updateStatus(this.host, data)
  }

  getStatus() {
    return getStatus(this.host)
  }

  clearStatus(...keys) {
    let data = {}

    for (let key of keys) {
      data[key] = undefined
    }

    this.status(data)
  }

  call(type, data) {
    let formData = {
      key: encrypt(JSON.stringify({
        secret: this.secret,
        salt: 'salt' + Math.random()
      }))
    }

    Object.assign(formData, data || {})

    return new Promise((resolve, reject) => {
      request.post({
        url: 'http://' + this.host + '/api/maintenance/' + type,
        formData: formData
      }, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        if (res && res.statusCode > 200) {
          reject(res.statusMessage)
        }

        resolve({
          res: res,
          body: body
        })
      })
    })
  }

  stream(type, data) {
    let formData = {
      key: encrypt(JSON.stringify({
        secret: this.secret,
        salt: 'salt' + Math.random()
      }))
    }

    Object.assign(formData, data || {})

    return request.post({
      url: 'http://' + this.host + '/api/maintenance/' + type,
      formData: formData
    })
  }

  /**
   * @returns {Promise<string>} Promise of file list path
   */
  getFileList(outputFile) {
    let temp = newTemp('remote-file-list')

    return new Promise((resolve, reject) => {
      let cleanupAndReject = seq(temp.cleanup, reject)
      let pack = temp.path + '/pack'
      let writeStream = createWriteStream(pack)

      this.stream('files')
        .pipe(writeStream)
        .on('error', err => cleanupAndReject)

      writeStream.on('finish', () => {
        writeStream.close(() => {
          unpack(pack)
            .then(() => {
              shellDoNow('mv ' + temp.path + '/list ' + outputFile)
              temp.cleanup()
              resolve(outputFile)
            })
            .catch(cleanupAndReject)
        })
      })
    })
  }

  update() {
    let temp = newTemp('update')

    return new Promise((resolve, reject) => {

      resolve = seq(temp.cleanup, resolve)
      reject = seq(temp.cleanup, reject)

      let localList = temp.path + '/localList'
      let remoteList = temp.path + '/remoteList'

      Promise.all([
        this.getFileList(remoteList),
        listFiles(localList)
      ])
        .then(() => {

          createUpdate(localList, remoteList, temp.path + '/updatePack')
            .then(packPath => {
              this.call('update', {
                pack: createReadStream(packPath)
              })
                .then(resolve)
                .catch(reject)
            })
            .catch(reject)

        })
        .catch(reject)

    })
  }

  rollback() {
    return new Promise((resolve, reject) => {
      this.call('rollback')
        .then(resolve)
        .catch(reject)
    })
  }

  readStatus() {
    return new Promise((resolve) => {
      this.call('status')
        .then(({ body }) => {
          //console.log('READ STATUS got body:', body)
          try {
            body = JSON.parse(body)
          } catch (e) { }

          this.setStatus({
            status: body,
            time: (new Date).toGMTString()
          })

          resolve()
        })
        .catch((err) => {
          this.setStatus({
            status: err.toString(),
            time: (new Date).toGMTString()
          })

          resolve()
        })
    })
  }
}

function tempPath(label) {
  return '/tmp/xeco-maintenance-' + label + '-' + (new Date).getTime()
}


/**
 * Generates a temporary location on disk
 * @param {string} label Seed for the temporary folder name
 */
function newTemp(label) {
  let path = tempPath(label)

  shellDoNow('mkdir ' + path)

  return {
    path: path,
    /** Deletes the generated temporary folder */
    cleanup: () => shellDoNow('rm -rf ' + path)
  }
}

/**
 * Returns a new function that will call all parameters (functions) in sequence
 * @param {...Function} funcs The functions to call in sequence
 * @returns Returns a function that calls all parameter functions and returns whatever the last parameter function returns
 */
function seq(...funcs) {
  return (...args) => {
    let res
    for (let func of funcs) {
      res = func.apply(null, args)
    }
    return res
  }
}

function shellDo(command, args, input, detach) {
  if (!args) args = []
  return new Promise((resolve, reject) => {
    console.log('MAINTENANCE run:', command, args, detach && '!!!  will run DETACHED  !!!')

    let options = {}
    if (detach) {
      options.detach = true
      options.stdio = 'ignore'
    }

    if (input) {
      options.stdio = 'pipe'
    }

    let child = spawn(command, args, options),
      output = '', error = ''

    child.on('close', code => {
      if (code) {
        console.log('MAINTENANCE err:', error)
        reject(error)
      } else {
        resolve(output)
      }
    })

    child.on('error', err => {
      console.log('MAINTENANCE err:', err)
      reject(err)
    })

    if (!detach) {
      child.stdout.on('data', data => {
        output += data.toString()
      })
      child.stderr.on('data', data => {
        error += data.toString()
      })
      if (input) {
        child.stdin.write(input)
        child.stdin.end()
      }
    }

    if (detach) {
      child.unref()
    }
  })
}

function shellDoNow(commandLine, input) {
  try {
    // console.log('MAINTENANCE run:', commandLine)
    let options = {}
    if (input) {
      options.input = input
    }
    return execSync(commandLine, options)
  } catch (e) {
    // console.log('MAINTENANCE err:', e)
    return e
  }
}


module.exports = {
  State: State,
  LocalStatus: {
    update(data) {
      updateStatus('local', data)
    },
    get() {
      return getStatus('local')
    }
  },
  applyUpdate: applyUpdate,
  rollbackUpdate: rollbackUpdate,
  encrypt: encrypt,
  decrypt: decrypt,
  listFiles: listFiles,
  pack: pack,
  packList: packList,
  unpack: unpack,
  createFileListPack: createFileListPack,
  RemoteHost: RemoteHost,
  newTemp: newTemp,
  tempPath: tempPath
}
