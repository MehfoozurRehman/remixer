#!/usr/bin/env node

import * as fs from 'fs';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import generator from './generator.js';
import inquirer from 'inquirer';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));

const CHOICES = fs.readdirSync(`${__dirname}/templates`);

const QUESTIONS = [
  {
    name: 'project-name',
    type: 'input',
    message: 'Project name:',
    validate: function (input) {
      if (/^([A-Za-z\-\\_\d])+$/.test(input)) return true;
      else return 'Project name may only include letters, numbers, underscores, and hashes.';
    },
  },
  {
    name: 'project-choice',
    type: 'list',
    message: 'What project template would you like to generate?',
    choices: CHOICES,
    validate: function (input) {
      if (CHOICES.includes(input)) return true;
      else return 'Please select a valid project template.';
    },
  },
];

const createProject = async () => {
  try {
    const answers = await inquirer.prompt(QUESTIONS);
    const projectChoice = answers['project-choice'];
    const projectName = answers['project-name'];
    const templatePath = `${__dirname}/templates/${projectChoice}`;
    const projectPath = `${CURR_DIR}/${projectName}`;

    if (fs.existsSync(projectPath)) {
      const overwriteAnswer = await inquirer.prompt([
        {
          name: 'overwrite',
          type: 'confirm',
          message: `A directory named '${projectName}' already exists. Do you want to overwrite it?`,
          default: false,
        },
      ]);
      if (!overwriteAnswer['overwrite']) {
        console.log('Aborted. Please choose a different project name.');
        return;
      }
    }

    fs.mkdirSync(projectPath);
    console.log(`Creating project '${projectName}' from template '${projectChoice}'...`);
    generator(templatePath, projectName);
    console.log('Project generation completed.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

const handleCancellation = () => {
  console.log('\nUser cancelled the prompt.');
  process.exit();
};

process.on('SIGINT', handleCancellation);

createProject();
