# esm-bundler

## usage

```zsh
node bundle.mjs -m <module name>

# add -d to re-export module as default export
# add -p to pack peer dependencies into the bundle
# -h for help
```

### output

- bundled file will be in the `dist` directory
- there will be three files: `<module>.es.js`, `<module>.umd.js` and `<module>.es.min.js`
  - the `es.js` and `es.min.js` file can be imported as an `esm`
  - the `umd.js` file needs to be included using a `<script />` tag
  - slash (`/`) characters in module names will be replaced with dashes (`-`)

## caveats

- please use node ver 14 or above
- this tool only bundles one module and its dependencies into one esm
- it should not be used to replace something like `webpack`
