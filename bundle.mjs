import fs from "fs/promises";
import theredoc from "theredoc";
import mkdirp from "mkdirp";
import { exec } from "child_process";
import { promisify } from "util";
import { build } from "vite";
import { program } from "commander";

const execAsync = promisify(exec);

program
  .option("-m, --moduleName <name>", "module to bundle")
  .option("-d, --asDefault", "re-export module using default export")
  .option("-p, --peers", "pack peer dependencies into same bundle")
  .option(
    "-D, --manualDeps <deps>",
    "manually specify dependencies, separated by commas"
  );

program.parse();
const { moduleName, asDefault, peers, manualDeps } = program.opts();
console.log({ moduleName, asDefault, peers, manualDeps });

if (!moduleName) {
  program.help();
}

const config = {
  build: {
    lib: {
      entry: "src/app.ts",
      name: "vendor",
      fileName: (format) => `${outputfileName}.${format}.js`,
    },
  },
  rollupOptions: {
    external: [],
  },
};

// install main module
await execAsync(`yarn add ${moduleName}`);

// process peer dependencies
const infoCmd = `yarn info ${moduleName} peerDependencies`;
const pkgInfo = await execAsync(infoCmd, { encoding: "utf8" });
const regex = /\{[\n\r\d\s\w\W]*\}/;
let peerDeps = [];
if (regex.test(pkgInfo)) {
  const peerDepsConfig = regex
    .exec(pkgInfo)[0]
    .replace(/'/g, `"`)
    .replace(/\{\r?\n/g, ``)
    .replace(/\r?\n}/g, ``);
  peerDeps = peerDepsConfig
    .split(/\r?\n/)
    .map((s) => /\s+([\w\W]+):/.exec(s)[1]);

  // install all peer deps as dev deps
  await execAsync(`yarn add -D ${peerDeps.join(" ")}`);
  config.rollupOptions.external = [config.rollupOptions.external, ...peerDeps];
}

// process manual dependencies
if (manualDeps) {
  const deps = manualDeps.split(",");
  await execAsync(`yarn add -D ${deps.join(" ")}`);
  config.rollupOptions.external = [config.rollupOptions.external, ...deps];
}

// create entry file
const entry = asDefault
  ? theredoc`
      import mod from '${moduleName}'
      export default mod
    `
  : theredoc`
      export * from '${moduleName}'
    `;
await mkdirp("src");
await fs.writeFile("src/app.ts", entry, "utf8");
const outputfileName = moduleName.replace("/", "-").replace("@", "");

// build bundle
await build(config);

// uglify esm
const ugInput = `dist/${outputfileName}.es.js`;
const ugOutput = `dist/${outputfileName}.es.min.js`;
const ugCmd = `yarn uglifyjs ${ugInput} --compress --mangle --module -o ${ugOutput}`;
await execAsync(ugCmd);

// clean up files
const manualDepKeys = manualDeps?.split(",").join(" ") ?? "";
const peerDepKeys = peerDeps.join(" ");
await fs.rm("src", { recursive: true });
await execAsync(`yarn remove ${moduleName} ${peerDepKeys} ${manualDepKeys}`);
