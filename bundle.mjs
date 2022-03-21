import fs from 'fs/promises'
import theredoc from 'theredoc'
import mkdirp from 'mkdirp'
import { execSync } from 'child_process'
import { build } from 'vite'
import { program } from 'commander'

program
  .option('-m, --moduleName <name>', 'module to bundle')
  .option('-d, --asDefault', 're-export module using default export')
  .option('-p, --peers', 'pack peer dependencies into same bundle')

program.parse()
const { moduleName, asDefault, peers } = program.opts()
console.log({ moduleName, asDefault, peers })

if (!moduleName) {
  program.help()
}

const infoCmd = `yarn info ${moduleName} peerDependencies`
const pkgInfo = execSync(infoCmd, { encoding: 'utf8' })
const regex = /\{[\n\r\d\s\w\W]*\}/
const peerDepsConfig = regex
  .exec(pkgInfo)[0]
  .replace(/'/g, `"`)
  .replace(/\{\r?\n/g, ``)
  .replace(/\r?\n}/g, ``)
const peerDeps = peerDepsConfig
  .split(/\r?\n/)
  .map((s) => /\s+([\w\W]+):/.exec(s)[1])

// install main module
execSync(`yarn add ${moduleName}`)

// install all peer deps as dev deps
execSync(`yarn add -D ${peerDeps.join(' ')}`)

const entry = asDefault
  ? theredoc`
      import mod from '${moduleName}'
      export default mod
    `
  : theredoc`
      export * from '${moduleName}'
    `
await mkdirp('src')
await fs.writeFile('src/app.ts', entry, 'utf8')
const outputfileName = moduleName.replace('/', '-')
await build({
  build: {
    lib: {
      entry: 'src/app.ts',
      name: 'vendor',
      fileName: (format) => `${outputfileName}.${format}.js`,
    },
    ...(!peers
      ? {
          rollupOptions: {
            external: peerDeps,
          },
        }
      : {}),
  },
})
await fs.rm('src', { recursive: true })
execSync(`yarn remove ${moduleName} ${peerDeps.join(' ')}`)
execSync(
  `yarn uglifyjs dist/${outputfileName}.es.js --compress --mangle -o dist/${outputfileName}.es.min.js`
)
