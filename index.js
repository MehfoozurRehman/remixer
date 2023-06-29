import chalk from 'chalk';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import yaml from 'js-yaml';

const CURR_DIR = process.cwd();
const PROJECT_NAME_PLACEHOLDER = 'project_name';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const replaceProjectNamePlaceholder = (data, projectName) => {
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => replaceProjectNamePlaceholder(item, projectName));
    } else {
      const updatedData = {};
      for (const key in data) {
        updatedData[key] = replaceProjectNamePlaceholder(data[key], projectName);
      }
      return updatedData;
    }
  } else if (typeof data === 'string') {
    return data.replace(new RegExp(PROJECT_NAME_PLACEHOLDER, 'g'), projectName);
  } else {
    return data;
  }
};

const generator = async (templatePath, newProjectPath, projectName) => {
  const filesToCreate = await fs.promises.readdir(templatePath);

  for (const file of filesToCreate) {
    const origFilePath = path.join(templatePath, file);
    const stats = await fs.promises.stat(origFilePath);

    if (stats.isFile()) {
      const writePath = path.join(CURR_DIR, newProjectPath, file);
      const fileExt = path.extname(file);

      if (['.js', '.jsx', '.html', '.md', '.tsx', '.yml', '.yaml'].includes(fileExt)) {
        let contents = await fs.promises.readFile(origFilePath, 'utf8');

        if (['.yml', '.yaml'].includes(fileExt)) {
          const yamlData = yaml.load(contents);
          const updatedYamlData = replaceProjectNamePlaceholder(yamlData, projectName);
          contents = yaml.dump(updatedYamlData);
        } else {
          contents = contents.replace(new RegExp(PROJECT_NAME_PLACEHOLDER, 'g'), projectName);
        }

        await fs.promises.writeFile(writePath, contents, 'utf8');
      } else if (file === 'package.json') {
        let contents = await fs.promises.readFile(origFilePath, 'utf8');
        const packageJson = JSON.parse(contents);
        packageJson.name = projectName;
        await fs.promises.writeFile(writePath, JSON.stringify(packageJson, null, 2), 'utf8');
      } else {
        const readStream = fs.createReadStream(origFilePath);
        const writeStream = fs.createWriteStream(writePath);
        readStream.pipe(writeStream);
      }
    } else if (stats.isDirectory()) {
      const newDirPath = path.join(CURR_DIR, newProjectPath, file);
      await fs.promises.mkdir(newDirPath);
      await generator(path.join(templatePath, file), path.join(newProjectPath, file), projectName);
    }
  }
};

const CHOICES = fs.readdirSync(`${__dirname}/templates`);

const QUESTIONS = [
  {
    name: 'project-name',
    type: 'input',
    message: 'Project name:',
    validate: function (input) {
      return /^([A-Za-z\-\\_\d.])+$/.test(input)
        ? true
        : 'Project name may only include letters, numbers, underscores, hashes, and dots.';
    },
  },
  {
    name: 'project-choice',
    type: 'list',
    message: 'What project template would you like to generate?',
    choices: CHOICES,
    validate: function (input) {
      return CHOICES.includes(input) ? true : 'Please select a valid project template.';
    },
  },
  {
    name: 'install-deps',
    type: 'confirm',
    message: 'Do you want to install dependencies?',
    default: true,
  },
  {
    name: 'init-git',
    type: 'confirm',
    message: 'Do you want to initialize Git?',
    default: true,
  },
];

const createProject = async () => {
  try {
    const answers = await inquirer.prompt(QUESTIONS);
    const {
      'project-choice': projectChoice,
      'project-name': projectName,
      'install-deps': installDeps,
      'init-git': initGit,
    } = answers;

    let finalProjectName = projectName;
    if (projectName === '.') {
      const currentDirName = path.basename(CURR_DIR);
      console.log(chalk.yellow(`Using current directory name '${currentDirName}' as the project name.`));
      finalProjectName = currentDirName;
    }

    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const projectPath = path.join(CURR_DIR, finalProjectName);

    if (fs.existsSync(projectPath)) {
      const overwriteAnswer = await inquirer.prompt([
        {
          name: 'overwrite',
          type: 'confirm',
          message: `A directory named '${finalProjectName}' already exists. Do you want to overwrite it?`,
          default: false,
        },
      ]);
      if (!overwriteAnswer.overwrite) {
        console.log(chalk.red('Aborted. Please choose a different project name.'));
        return;
      } else {
        fs.rmdirSync(projectPath, { recursive: true });
        console.log(chalk.yellow(`Removed existing directory '${finalProjectName}'.`));
      }
    }

    fs.mkdirSync(projectPath);
    console.log(chalk.green(`Created project directory at ${projectPath}`));

    console.log(chalk.green(`Creating project '${finalProjectName}' from template...`));
    await generator(templatePath, finalProjectName, finalProjectName);
    console.log(chalk.green('Project generation completed.'));

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
      const installCommand = packageManager === 'yarn' ? 'yarn install' : 'npm install --legacy-peer-deps';
      execSync(installCommand, { cwd: projectPath, stdio: 'inherit' });
      console.log(chalk.yellow('Dependencies installed successfully.'));
    }

    if (initGit) {
      execSync('git init', { cwd: projectPath, stdio: 'inherit' });
      console.log(chalk.yellow('Git initialized.'));
    }

    console.log(chalk.green.bold('\nProject setup completed.'));
    console.log(chalk.green(`\nYour project '${finalProjectName}' is ready at ${projectPath}`));
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error);
  }
};

createProject();
