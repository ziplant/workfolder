#!/usr/bin/env node
const commander = require('commander')
const package = require('./package.json')
const fs = require('fs-extra')
const path = require('path')
const { exec } = require("child_process")

commander.version(package.version).description(package.description)

commander
  .command('create <name>')
  .description('Create project directory')
  .action(async (name) => {
    console.log('Copy files...')
    await fs.copy(path.resolve(__dirname, 'project'), name)
    console.log('Downloading node_modules...')
    exec(`cd ${name} && npm install`, (error) => {
      if (error) {
          console.log(`error: ${error.message}`)
          return
      }

      console.log('Project created!')
    });
  })

commander.parse(process.argv)