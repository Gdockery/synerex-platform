let fs = require('fs')
let pth = require('path')

function localPath(path) {
    return pth.resolve(sails.config.storage.localPath + '/files/' + path)
}

function webPath(path) {
    return '/files/' + path
}

function existsSync(path) {
    return fs.existsSync(localPath(path))
}

function remove(path) {
    if(existsSync(path)) {
        return fs.unlinkSync(localPath(path))
    }
}

function ensureParentOf(file) {
    let folder = pth.dirname(file)
    
    if(folder != '/') {
        ensureParentOf(folder)

        if(!fs.existsSync(folder)) {
            fs.mkdirSync(folder)
        }
    }
}

function writeSync(path, content) {
    let file = localPath(path)
    ensureParentOf(file)

    return fs.writeFileSync(file, content)
}

function writeStream(path, stream, cb) {
    let file = localPath(path)
    ensureParentOf(file)
    
    let ws = fs.createWriteStream(file)
    stream.on('end', () => {
        ws.end()
        cb()
    })
    stream.on('error', err => {
        ws.end()
        cb(err)
    })
    stream.pipe(ws)
}

module.exports = {
    existsSync: existsSync,
    remove: remove,
    writeSync: writeSync,
    writeStream: writeStream,
    localPath: localPath,
    webPath: webPath
}