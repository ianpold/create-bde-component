#!/usr/bin/env node
const fs = require('fs');
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs');

const Mustache = require('mustache')

const README_TEMPLATE = require.resolve('./templates/README.mustache');
const README_FILENAME = 'README.md';

const argv = yargs(hideBin(process.argv))
  .command('[component]', 'Initialize a new BDE component', (yargs) => {
    yargs
      .positional('component', {
        describe: 'directory to create. Must match component name'
      })
  })
  // .option('verbose', {
  //   alias: 'v',
  //   type: 'boolean',
  //   description: 'Run with verbose logging'
  // })
  .argv

const componentName = argv._[0];

if (!componentName) { 
  console.error('Please provide a name for the component as the first argument');
  process.exit(1);
}

console.log('Creating README...')
fs.readFile(README_TEMPLATE, function (readError, data) {
  if (readError) throw err;
  var output = Mustache.render(data.toString(), { component: componentName });
  if (!fs.existsSync(componentName)){
    fs.mkdirSync(componentName);
  }
  fs.writeFile(`./${componentName}/${README_FILENAME}`, output, writeErr => { if (writeErr) throw writeErr;})
});