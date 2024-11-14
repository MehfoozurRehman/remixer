#!/usr/bin/env node

import { createReadStream, createWriteStream, promises as fs } from "fs";

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

const colorize = (text, color) =>
  console.log(colors[color] + text + colors.reset);

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

    return generateYamlRecursively(jsonData);
  } catch (error) {
    colorize(`Error converting JSON to YAML: ${error.message}`, "red");
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
    colorize(`Error converting YAML to JSON: ${error.message}`, "red");
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
    const filesToCreate = await fs.readdir(templatePath);

    for (const file of filesToCreate) {
      const origFilePath = path.join(templatePath, file);
      const stats = await fs.stat(origFilePath);

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
    colorize(`Error generating project files: ${error.message}`, "red");
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
    let contents = await fs.readFile(origFilePath, "utf8");

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

    await fs.writeFile(writePath, contents, "utf8");
  } else if (file === "package.json") {
    let contents = await fs.readFile(origFilePath, "utf8");
    const packageJson = JSON.parse(contents);
    packageJson.name = projectName;
    await fs.writeFile(writePath, JSON.stringify(packageJson, null, 2), "utf8");
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
  await fs.mkdir(newDirPath, { recursive: true });
  await generateProjectFiles(
    path.join(origFilePath),
    path.join(newProjectPath, file),
    projectName
  );
};

const askQuestions = async () => {
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
  return {
    projectName: answers["project-name"],
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
    colorize("Aborted. Please choose a different project name.", "red");
    return false;
  } else {
    await fs.rm(projectPath, { recursive: true, force: true });
    colorize(`Removed existing directory '${finalProjectName}'.`, "yellow");
    return true;
  }
};

const createProjectDirectory = async (projectPath) => {
  try {
    await fs.mkdir(projectPath, { recursive: true });
    colorize(`Created project directory at ${projectPath}`, "green");
  } catch (error) {
    colorize(
      `Error creating project directory at ${projectPath}: ${error.message}`,
      "red"
    );
  }
};

const generateProjectFromTemplate = async (templateUrl, finalProjectName) => {
  try {
    colorize(
      `Creating project '${finalProjectName}' from template '${templateUrl}'...`,
      "cyan"
    );
    await simpleGit().clone(templateUrl, finalProjectName);
    colorize(`Project '${finalProjectName}' generated successfully!`, "green");
  } catch (error) {
    colorize(
      `Error generating project '${finalProjectName}': ${error.message}`,
      "red"
    );
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
      colorize(`Installing ${packageManager} globally...`, "cyan");
      execSync(`npm install -g ${packageManager}`, { stdio: "inherit" });
    }

    colorize(`Installing dependencies with ${packageManager}...`, "cyan");
    execSync(installCommands[packageManager], {
      cwd: projectPath,
      stdio: "inherit",
    });
    colorize("Dependency installation completed.", "green");
  } catch (error) {
    colorize(
      `Error installing dependencies with ${packageManager}: ${error.message}`,
      "red"
    );
  }
};

const initializeGitRepositoryFromScratch = async (projectPath) => {
  try {
    const git = simpleGit(projectPath);
    await git.init();
    colorize(`Git repository initialized successfully!`, "green");
  } catch (error) {
    colorize(`Error initializing Git repository: ${error.message}`, "red");
  }
};

const createProject = async () => {
  try {
    const { projectName, installDeps, initGit } = await askQuestions();

    const projectPath = path.join(CURR_DIR, projectName);

    if (
      await fs
        .access(projectPath)
        .then(() => true)
        .catch(() => false)
    ) {
      const shouldOverwrite = await confirmOverwrite(projectPath, projectName);
      if (!shouldOverwrite) {
        return;
      }
    }

    await createProjectDirectory(projectPath);

    const templateUrl = "https://github.com/MehfoozurRehman/remixer-web.git";
    await generateProjectFromTemplate(templateUrl, projectName);

    colorize("Project generated successfully!", "green");

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

    colorize("All set! Happy coding!", "green");
  } catch (error) {
    colorize(
      "An error occurred while generating the project." + error.message,
      "red"
    );
    await fs.rm(projectPath, { recursive: true, force: true });
    colorize(`Removed project directory '${projectName}'.`, "yellow");
  }
};

const main = async () => {
  try {
    await createProject();
  } catch (error) {
    colorize(error.message, "red");
  }
};

main();
