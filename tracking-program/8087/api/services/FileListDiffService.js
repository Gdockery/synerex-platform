const Act = {
    Delete: 'delete',
    Send: 'send'
}

const Type = {
    File: 'file',
    Folder: 'folder'
}

function node(name, type, checksum, action, children) {
    return {
        name: name,
        type: type,
        checksum: checksum,
        action: action,
        children: children
    }
}

function file(name, checksum, action) {
    return node(name, Type.File, checksum, action, undefined)
}

function folder(name, action) {
    return node(name, Type.Folder, undefined, action, {})
}

function undelete(node) {
    if(node.action == Act.Delete) {
        delete node.action
    }
}

function itemList(folders, files, checksums) {
    return {
        folders: folders,
        files: files,
        checksums: checksums
    }
}

function diffList(sourceItems, targetItems) {
    let diffTree = folder('')

    for(let i in targetItems.files) {
        let node = diffTree
        let currentName = ''
        let path = targetItems.files[i].split('/')
        let leaf = path.pop()
        for(let name of path) {
            currentName += name + '/'
            if(!node.children[name]) {
                node.children[name] = folder(currentName, Act.Delete)
            }
            node = node.children[name]
        }
        node.children[leaf] = file(currentName + leaf, targetItems.checksums[i], Act.Delete)
    }
    
    for(let i in targetItems.folders) {
        let node = diffTree
        let currentName = ''
        let path = targetItems.folders[i].split('/')
        for(let name of path) {
            currentName += name + '/'
            if(!node.children[name]) {
                node.children[name] = folder(currentName, Act.Delete)
            }
            node = node.children[name]
        }
    }
    
    for(let i in sourceItems.files) {
        let node = diffTree
        let currentName = ''
        let path = sourceItems.files[i].split('/')
        let leaf = path.pop()
        for(let name of path) {
            currentName += name + '/'
            undelete(node)
            if(!node.children[name]) {
                node.children[name] = folder(currentName, Act.Send)
            }
            node = node.children[name]
        }
        if(!node.children[leaf]) {
            node.children[leaf] = file(currentName + leaf, sourceItems.checksums[i], Act.Send)
        } else {
            if(node.children[leaf].checksum != sourceItems.checksums[i]) {
                node.children[leaf].checksum = sourceItems.checksums[i]
                node.children[leaf].action = Act.Send
            } else {
                delete node.children[leaf].action
            }
        }
    }
    
    for(let i in sourceItems.folders) {
        let node = diffTree
        let currentName = ''
        let path = sourceItems.folders[i].split('/')
        for(let name of path) {
            currentName += name + '/'
            undelete(node)
            if(!node.children[name]) {
                node.children[name] = folder(currentName, Act.Send)
            } else {
                undelete(node.children[name])
            }
            node = node.children[name]
        }
    }
    
    let diffList = {}
    diffList[Act.Delete] = {}
    diffList[Act.Delete][Type.File] = []
    diffList[Act.Delete][Type.Folder] = []
    diffList[Act.Send] = {}
    diffList[Act.Send][Type.File] = []
    diffList[Act.Send][Type.Folder] = []
    
    function parseTree(node) {
        if(node.action) {
            diffList[node.action][node.type].push(node.name)
        }
        if(node.children) {
            for(let name in node.children) {
                parseTree(node.children[name])
            }
        }
    }
    
    parseTree(diffTree)

    return diffList
}

module.exports = {
    itemList: itemList,
    diffList: diffList
}