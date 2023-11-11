#!/usr/bin/env node

import {
  createReadStream,
  createWriteStream,
  existsSync,
  promises,
  rmdirSync,
} from "fs";

import { execSync } from "child_process";
import inquirer from "inquirer";
import path from "path";
import simpleGit from "simple-git";

const CURR_DIR = process.cwd();
const PROJECT_NAME_PLACEHOLDER = "project_name";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const colorize = (text, color) => colors[color] + text + colors.reset;

const convertJsonToYaml = (jsonData) => {
  try {
    const generateYamlRecursively = (data, indent = "") => {
      let yamlData = "";
      for (const key in data) {
        if (typeof data[key] === "object") {
          yamlData += `${indent}${key}:\n`;
          yamlData += generateYamlRecursively(data[key], `${indent}  `);
        } else {
          yamlData += `${indent}${key}: ${data[key]}\n`;
        }
      }
      return yamlData;
    };

    const yamlData = generateYamlRecursively(jsonData);
    return yamlData;
  } catch (error) {
    console.error(error);
    throw new Error(`Error converting JSON to YAML: ${error.message}`);
  }
};

const convertYamlToJson = (yamlData) => {
  try {
    const lines = yamlData.split("\n");
    const jsonData = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("#") || trimmedLine === "") {
        continue;
      }

      const [key, value] = trimmedLine.split(":").map((item) => item.trim());
      jsonData[key] = value || {};
    }

    return JSON.stringify(jsonData, null, 2);
  } catch (error) {
    console.error(error);
    throw new Error(`Error converting YAML to JSON: ${error.message}`);
  }
};

const replaceProjectNamePlaceholder = (data, projectName) => {
  if (typeof data === "object") {
    return Array.isArray(data)
      ? data.map((item) => replaceProjectNamePlaceholder(item, projectName))
      : Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            replaceProjectNamePlaceholder(value, projectName),
          ])
        );
  } else if (typeof data === "string") {
    return data.replace(new RegExp(PROJECT_NAME_PLACEHOLDER, "g"), projectName);
  } else {
    return data;
  }
};

const generateProjectFiles = async (
  templatePath,
  newProjectPath,
  projectName
) => {
  try {
    const filesToCreate = await promises.readdir(templatePath);

    for (const file of filesToCreate) {
      const origFilePath = path.join(templatePath, file);
      const stats = await promises.stat(origFilePath);

      if (stats.isFile()) {
        await generateFile(origFilePath, file, newProjectPath, projectName);
      } else if (stats.isDirectory()) {
        await generateDirectory(
          origFilePath,
          file,
          newProjectPath,
          projectName
        );
      }
    }
  } catch (error) {
    console.error(error);
    throw new Error(`Error generating project: ${error.message}`);
  }
};

const generateFile = async (
  origFilePath,
  file,
  newProjectPath,
  projectName
) => {
  const writePath = path.join(CURR_DIR, newProjectPath, file);
  const fileExt = path.extname(file);

  if (
    [".js", ".jsx", ".html", ".md", ".tsx", ".yml", ".yaml"].includes(
      fileExt
    ) ||
    file.startsWith(".")
  ) {
    let contents = await promises.readFile(origFilePath, "utf8");

    if ([".yml", ".yaml"].includes(fileExt)) {
      const yamlData = JSON.parse(convertYamlToJson(contents));
      const updatedYamlData = replaceProjectNamePlaceholder(
        yamlData,
        projectName
      );
      contents = convertJsonToYaml(updatedYamlData);
    } else {
      contents = contents.replace(
        new RegExp(PROJECT_NAME_PLACEHOLDER, "g"),
        projectName
      );
    }

    await promises.writeFile(writePath, contents, "utf8");
  } else if (file === "package.json") {
    let contents = await promises.readFile(origFilePath, "utf8");
    const packageJson = JSON.parse(contents);
    packageJson.name = projectName;
    await promises.writeFile(
      writePath,
      JSON.stringify(packageJson, null, 2),
      "utf8"
    );
  } else {
    const readStream = createReadStream(origFilePath);
    const writeStream = createWriteStream(writePath);
    readStream.pipe(writeStream);
  }
};

const generateDirectory = async (
  origFilePath,
  file,
  newProjectPath,
  projectName
) => {
  const newDirPath = path.join(CURR_DIR, newProjectPath, file);
  await promises.mkdir(newDirPath, { recursive: true });
  await generateProjectFiles(
    path.join(origFilePath),
    path.join(newProjectPath, file),
    projectName
  );
};

const askQuestions = async () => {
  const templates = [
    { name: "api", url: "https://github.com/MehfoozurRehman/remixer-api.git" },
    { name: "web", url: "https://github.com/MehfoozurRehman/remixer-web.git" },
    {
      name: "electron",
      url: "https://github.com/MehfoozurRehman/remixer-electron.git",
    },
  ];
  const templateChoices = templates.map((template) => template.name);
  const answers = await inquirer.prompt([
    {
      name: "project-name",
      type: "input",
      message: "Project name:",
      validate: (input) =>
        /^([A-Za-z\-\\_\d.])+$/.test(input)
          ? true
          : "Project name may only include letters, numbers, underscores, hashes, and dots.",
    },
    {
      name: "project-choice",
      type: "list",
      message: "What project template would you like to generate?",
      choices: templateChoices,
      validate: (input) =>
        templateChoices.includes(input)
          ? true
          : "Please select a valid project template.",
    },
    {
      name: "install-deps",
      type: "confirm",
      message: "Do you want to install dependencies?",
      default: true,
    },
    {
      name: "init-git",
      type: "confirm",
      message: "Do you want to initialize Git?",
      default: true,
    },
  ]);
  const selectedTemplate = templates.find(
    (template) => template.name === answers["project-choice"]
  );
  return {
    projectName: answers["project-name"],
    templateUrl: selectedTemplate.url,
    installDeps: answers["install-deps"],
    initGit: answers["init-git"],
  };
};

const confirmOverwrite = async (projectPath, finalProjectName) => {
  const overwriteAnswer = await inquirer.prompt([
    {
      name: "overwrite",
      type: "confirm",
      message: `A directory named '${finalProjectName}' already exists. Do you want to overwrite it?`,
      default: false,
    },
  ]);
  if (!overwriteAnswer.overwrite) {
    console.log(
      colorize("Aborted. Please choose a different project name.", "red")
    );
    return false;
  } else {
    rmdirSync(projectPath, { recursive: true });
    console.log(
      colorize(`Removed existing directory '${finalProjectName}'.`, "yellow")
    );
    return true;
  }
};

const createProjectDirectory = async (projectPath) => {
  try {
    await promises.mkdir(projectPath, { recursive: true });
    console.log(
      colorize(`Created project directory at ${projectPath}`, "green")
    );
  } catch (error) {
    console.error(error);
    throw new Error(`Error creating project directory: ${error.message}`);
  }
};

const generateProjectFromTemplate = async (templateUrl, finalProjectName) => {
  try {
    console.log(
      colorize(
        `Creating project '${finalProjectName}' from template '${templateUrl}'...`,
        "cyan"
      )
    );
    await simpleGit().clone(templateUrl, finalProjectName);
    console.log(
      colorize(`Project '${finalProjectName}' generated successfully!`, "green")
    );
  } catch (error) {
    console.error(error);
    throw new Error(`Error generating project from template: ${error.message}`);
  }
};

const installDependencies = async (projectPath, packageManager) => {
  try {
    const installCommands = {
      npm: "npm install --legacy-peer-deps",
      yarn: "yarn install",
      pnpm: "pnpm install",
    };

    if (
      packageManager !== "npm" &&
      !existsSync(path.join(process.env.APPDATA, `npm/${packageManager}.cmd`))
    ) {
      console.log(colorize(`Installing ${packageManager} globally...`, "cyan"));
      execSync(`npm install -g ${packageManager}`, { stdio: "inherit" });
    }

    console.log(
      colorize(`Installing dependencies with ${packageManager}...`, "cyan")
    );
    execSync(installCommands[packageManager], {
      cwd: projectPath,
      stdio: "inherit",
    });
    console.log(colorize("Dependency installation completed.", "green"));
  } catch (error) {
    console.error(error);
    throw new Error(`Error installing dependencies: ${error.message}`);
  }
};

const initializeGitRepositoryFromScratch = async (projectPath) => {
  try {
    const git = simpleGit(projectPath);
    await git.init();
    console.log(colorize(`Git repository initialized successfully!`, "green"));
  } catch (error) {
    console.error(error);
    throw new Error(`Error initializing Git repository: ${error.message}`);
  }
};

const createProject = async () => {
  try {
    const { projectName, templateUrl, installDeps, initGit } =
      await askQuestions();

    const projectPath = path.join(CURR_DIR, projectName);

    if (existsSync(projectPath)) {
      const shouldOverwrite = await confirmOverwrite(projectPath);
      if (!shouldOverwrite) {
        return;
      }
    }

    await createProjectDirectory(projectPath);

    await generateProjectFromTemplate(templateUrl, projectName);

    console.log(colorize("Project generated successfully!", "green"));

    if (installDeps) {
      const packageManagerAnswer = await inquirer.prompt([
        {
          name: "package-manager",
          type: "list",
          message: "Select a package manager:",
          choices: ["npm", "yarn", "pnpm"],
        },
      ]);
      const packageManager = packageManagerAnswer["package-manager"];
      await installDependencies(projectPath, packageManager);
    }

    if (initGit) {
      await initializeGitRepositoryFromScratch(projectPath);
    }

    console.log(colorize("All set! Happy coding!", "green"));
  } catch (error) {
    console.error(error);
    console.log(
      colorize("An error occurred while generating the project.", "red")
    );
    rmdirSync(projectPath, { recursive: true });
    console.log(
      colorize(`Removed project directory '${projectName}'.`, "yellow")
    );
  }
};

const main = async () => {
  try {
    await createProject();
  } catch (error) {
    console.error(error);
  }
};

main();
