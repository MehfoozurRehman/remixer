import * as fs from 'fs';

import chalk from 'chalk';
import { dirname } from 'path';
import { execSync } from 'child_process';
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
  {
    name: 'install-deps',
    type: 'confirm',
    message: 'Do you want to install dependencies?',
    default: true,
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
        console.log(chalk.red('Aborted. Please choose a different project name.'));
        return;
      } else {
        fs.rmdirSync(projectPath, { recursive: true });
      }
    }

    fs.mkdirSync(projectPath);
    console.log(
      chalk.green(`Creating project '${projectName}' from template '${projectChoice}'...`)
    );
    generator(templatePath, projectName, projectName);
    console.log(chalk.green('Project generation completed.'));

    const installDeps = answers['install-deps'];
    if (installDeps) {
      const packageManagerAnswer = await inquirer.prompt([
        {
          name: 'package-manager',
          type: 'list',
          message: 'Select a package manager:',
          choices: ['npm', 'yarn'],
        },
      ]);
      const packageManager = packageManagerAnswer['package-manager'];
      console.log(chalk.yellow(`Installing dependencies with ${packageManager}...`));
      const installCommand =
        packageManager === 'yarn' ? 'yarn install' : 'npm install --legacy-peer-deps';
      execSync(installCommand, { cwd: projectPath, stdio: 'inherit' });
      console.log(chalk.yellow('Dependencies installed successfully.'));
    }

    console.log(chalk.green.bold('\nProject setup completed.'));
    console.log(chalk.green(`\nYour project '${projectName}' is ready at ${projectPath}`));
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error);
  }
};

const handleCancellation = () => {
  console.log(chalk.yellow('\nUser cancelled the prompt.'));
  process.exit();
};

process.on('SIGINT', handleCancellation);

createProject();
