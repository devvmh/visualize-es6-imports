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
  let directory = dirname(importer.replace(/^Metamaps\//, ''))
  let file = oldName.replace(/\.js$/, '').replace(/^\.\//, '')
  while (file.startsWith('../')) {
    directory = dirname(directory)
    file = file.replace(/^\.\.\//, '')
  }

  if (directory === '.') return `${file}.js`

  return `${directory}/${file}.js`
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
