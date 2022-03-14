import fs from 'fs/promises'
import theredoc from 'theredoc'
import mkdirp from 'mkdirp'
import { execSync } from 'child_process'
import { build } from 'vite'
import { program } from 'commander'

program
  .option('-m, --moduleName <name>', 'module to bundle')
  .option('-d, --asDefault', 're-export module using default export')

program.parse()
const { moduleName, asDefault } = program.opts()

if (!moduleName) {
  program.help()
}

execSync(`yarn add ${moduleName}`)
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
  },
})
await fs.rm('src', { recursive: true })
execSync(`yarn remove ${moduleName}`)
execSync(
  `yarn uglifyjs dist/${outputfileName}.es.js --compress --mangle -o dist/${outputfileName}.es.min.js`
)
