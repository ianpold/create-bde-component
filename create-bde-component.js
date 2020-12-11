#!/usr/bin/env node
const fs = require('fs');
const { prompt } = require('enquirer');

const Mustache = require('mustache')

const README_TEMPLATE = require.resolve('./templates/README.mustache');
const OPENAPI_TEMPLATE = require.resolve('./templates/openapi.mustache');

const MVNW = require.resolve('./mvnw');

const README_FILENAME = 'README.md';
const OPENAPI_FILENAME = 'openapi.yaml';
const INITIAL_SEMVER='0.1.0'

const BEAM = 'Apache Beam'
const JAVA_CLOUD_RUN = 'Cloud Run (Java)'

const JAVA = 'java'

function populateTemplate(template, values, outputPath) { 
  
  const { name } = values
  
  fs.readFile(template, function (readError, data) {
    if (readError) throw err;
    var output = Mustache.render(data.toString(), values);
    if (!fs.existsSync(name)) {
      fs.mkdirSync(name);
    }
    fs.writeFile(outputPath, output, writeErr => { if (writeErr) throw writeErr; })
  });
}

async function createComponent() {

  const projectArguments = await prompt([
    {
      type: 'input',
      name: 'componentName',
      message: 'What are you going to call your component?'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Please add a short description of what your component does'
    },
    {
      name: 'componentType',
      type: 'select',
      message: 'What type of project are you creating?',
      choices: [BEAM, JAVA_CLOUD_RUN, 'Other']
    }
  ]);


  
  const { componentName, description, componentType } = projectArguments;

  const component = componentFactory(componentType)
  
  console.log(`Creating README for ${componentName}...`)
  populateTemplate(README_TEMPLATE, {name : componentName, description: description}, `./${componentName}/${README_FILENAME}`)
  
  const { spawn } = require('child_process')

  if (component.language === JAVA) {

    const workingDirectory = process.cwd()

    // TODO - Sanitize user input!
     const { archetypeGroupId, archetypeArtifactId } = component

      const mavenProcess = spawn(`${MVNW}`, [
        'archetype:generate',
        `-DoutputDirectory=${workingDirectory}`,
        `-DarchetypeGroupId=${archetypeGroupId}`,
        `-DarchetypeArtifactId=${archetypeArtifactId}`,
        '-DgroupId=com.itv.bde',
        `-DartifactId=${componentName}`,
        `-Dversion=${INITIAL_SEMVER}`,
        '-DinteractiveMode=false'
      ], { cwd: require.resolve.paths('./')[0] })
       
    
      mavenProcess.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      mavenProcess.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      mavenProcess.on('exit', (code) => {
        console.log(`child process exited with code ${code}`);
      });

      mavenProcess.on('error', (code) => {
        console.error(`Something unexpected has happened. FIX IT!!! ${code}`);
      });
    
  }

  if (component.http) { 
    populateTemplate(OPENAPI_TEMPLATE, {name: componentName}, `./${componentName}/${OPENAPI_FILENAME}`)
  }

}

function componentFactory(componentType) { 
  switch (componentType) { 
    case BEAM: return {
      type: BEAM,
      language: JAVA,
      http: false,
      archetypeGroupId: 'org.apache.beam',
      archetypeArtifactId: 'beam-sdks-java-maven-archetypes-starter',
    }
    case JAVA_CLOUD_RUN: return {
      type: JAVA_CLOUD_RUN,
      language: JAVA,
      http: true,
      archetypeGroupId: 'org.apache.maven.archetypes',
      archetypeArtifactId: 'maven-archetype-quickstart',
    }
  }    
}

createComponent();
