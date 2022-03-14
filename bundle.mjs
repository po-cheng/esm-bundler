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
      import mode from '${moduleName}'
      export default mod
    `
  : theredoc`
      export * from '${moduleName}'
    `
await mkdirp('src')
await fs.writeFile('src/app.ts', entry, 'utf8')
await build({
  build: {
    lib: {
      entry: 'src/app.ts',
      name: 'vendor',
      fileName: (format) => `${moduleName.replace('/', '-')}.${format}.js`,
    },
  },
})
execSync(`yarn remove ${moduleName}`)
