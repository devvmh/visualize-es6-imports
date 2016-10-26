import fs from 'fs'
import detect from 'detect-import-require'
import { exec } from 'child_process'
import { basename, extname, dirname } from 'path'

function getFiles() {
  return new Promise((resolve, reject) => {
    const find_cmd = "find Metamaps -type f -name '*.js'"
    exec(find_cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve(stdout.split("\n"))   
      }
    })
  })
}

function standardizeName(oldName, importer) {
  let directory = dirname(importer.replace(/^Metamaps\//, ''))
  let file = oldName.replace(/(index)?\.js$/, '').replace(/^\.\//, '')

  while (file.startsWith('../')) {
    directory = dirname(directory)
    file = file.replace(/^\.\.\//, '')
  }

  if (directory === '.') return file
  if (file === 'index') return directory

  return `${directory}/${file}`
}

/*
 * @param file - path to file
 */
function getFileDeps(file) {
  const src = fs.readFileSync(file, 'utf8')
  const deps = detect(src, { requires: false })
  const external = deps.filter(dep => !dep.startsWith('.'))
  const internal = deps.filter(dep => dep.startsWith('.')).map(dep => standardizeName(dep, file))
  return { external, internal }
}

function getDeps(files) {
  const deps = {}
  files.forEach(file => {
    if (file === '') return
    const niceName = file.replace(/^Metamaps\//, '').replace(/\.js$/, '').replace(/\/index/, '')
    deps[niceName] = getFileDeps(file)
  })
  return deps
}

// TODO remove this function?
function removePatchedAndComponents(deps) {
  return Object.keys(deps).reduce((newDeps, currentKey) => {
    const original = deps[currentKey]
    const { internal, external } = original
    newDeps[currentKey] = {
      external,
      internal: internal.filter(dep => !dep.startsWith('component') && !dep.startsWith('patched'))
    }
    return newDeps
  }, {})
}

function verifyAllInternalDependenciesExist(deps) {
  const allkeys = Object.keys(deps)
  Object.keys(deps).forEach(filename => {
    const file = deps[filename]
    file.internal.forEach(dependency => {
      if (allkeys.indexOf(dependency) === -1) {
        console.log(`dependency doesn't exist! ${dependency}`)
        throw new Error(`dependency doesn't exist! ${dependency}`)
      }
    })
  })
  return deps
}

function getExternals(deps) {
  // hash table for uniqueness
  const depsObject = {}
  Object.keys(deps).forEach(key => {
    deps[key].external.forEach(external => {
      if (external == '') return
      depsObject[external] = true
    })
  })
  return Object.keys(depsObject)
}

function buildCSV(deps) {
  const csv = []

  csv.push(['Topics'])
  csv.push(['Name', 'Metacode'])

  Object.keys(deps).forEach(name => csv.push([name, 'Resource']))
  getExternals(deps).forEach(name => csv.push([name, 'Reference']))

  csv.push([])
  csv.push(['Synapses'])
  csv.push(['Topic1', 'Topic2'])

  Object.keys(deps).forEach(name => {
    const { internal, external } = deps[name]
    internal.forEach(dep => csv.push([name, dep]))
    external.forEach(dep => csv.push([name, dep]))
  })

  return csv
}

/*
 * MAIN
 */

getFiles()
.then(getDeps)
.then(removePatchedAndComponents) // TODO remove this
.then(verifyAllInternalDependenciesExist)
.then(buildCSV)
.then(csvArray => {
  const csvString = csvArray.map(row => {
    return '"' + row.map(col => {
      return col.replace('"', '""')
    }).join('","') + '"'
  }).join("\r\n")
  console.log(csvString)
}).catch(error => {
  console.error(error.stack)
})
