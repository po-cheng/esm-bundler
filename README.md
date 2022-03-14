# esm-bundler

## usage

```zsh
node bundle.mjs -m <module name>

# add -d flag to re-export module as default export
# -h for help
```

### output

- bundled file will be in the `dist` directory
- there will be two files: `<module>.es.js` and `<module>.umd.js`
  - the `es.js` file can be imported as an `esm`
  - the `umd.js` file needs to be included using a `<script />` tag

## caveats

- please use node ver 14 or above
- this tool only bundles one module and its dependencies into one esm
- it should not be used to replace something like `webpack`
