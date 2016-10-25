import fs from 'fs'
import detect from 'detect-import-require'
import { exec } from 'child_process'

function getFiles() {
  return new Promise((resolve, reject) => {
    const find_cmd = 'find Metamaps -type f -name *.js'
    exec(find_cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        console.log(stdout)
        resolve(stdout.split("\n"))   
      }
    })
  })
}

/*
 * @param file - path to file
 */
function getDeps(file) {
  console.log(file)
  const src = fs.readFileSync(file, 'utf8')
  const deps = detect(src)
  return {
    sameFolder: deps.filter(dep => dep.startsWith('./')),
    otherFolder: deps.filter(dep => dep.startsWith('../')),
    external: deps.filter(dep => !dep.startsWith('.'))
  }
}

/*
 * MAIN
 */

getFiles().then(files => {
  const deps = {}
  files.forEach(file => {
    if (file === '') return
    deps[file] = getDeps(file)
  })
  console.log(deps)
})
