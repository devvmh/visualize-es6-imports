import fs from 'fs'
import detect from 'detect-import-require'
import { exec } from 'child_process'
import { basename, extname, dirname } from 'path'

function getFiles() {
  return new Promise((resolve, reject) => {
    const find_cmd = 'find Metamaps -type f -name *.js'
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
  const step1 = oldName.replace(/^Metamaps\//, '').replace(/\.js$/, '')
  return step1
}

/*
 * @param file - path to file
 */
function getFileDeps(file) {
  const src = fs.readFileSync(file, 'utf8')
  const deps = detect(src, { requires: false }).map(dep => standardizeName(dep, file))
  console.log(deps)
  return {
    sameFolder: deps.filter(dep => dep.startsWith('./')),
    otherFolder: deps.filter(dep => dep.startsWith('../')),
    external: deps.filter(dep => !dep.startsWith('.'))
  }
}

function getDeps(files) {
  const deps = {}
  files.forEach(file => {
    if (file === '') return
    const niceName = standardizeName(file, '')
    deps[niceName] = getFileDeps(file)
  })
  return deps
}

/*
 * MAIN
 */

getFiles().then(getDeps).then(deps => {
  console.log(deps)
})
