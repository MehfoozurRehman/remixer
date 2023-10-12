#!/usr/bin/env node

import colorize from "./colorize";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";

const CURR_DIR = process.cwd();
const PROJECT_NAME_PLACEHOLDER = "project_name";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const replaceProjectNamePlaceholder = (data, projectName) => {
  if (typeof data === "object") {
    if (Array.isArray(data)) {
      return data.map((item) =>
        replaceProjectNamePlaceholder(item, projectName)
      );
    } else {
      const updatedData = {};
      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          updatedData[key] = replaceProjectNamePlaceholder(
            data[key],
            projectName
          );
        }
      }
      return updatedData;
    }
  } else if (typeof data === "string") {
    return data.replace(new RegExp(PROJECT_NAME_PLACEHOLDER, "g"), projectName);
  } else {
    return data;
  }
};

const generator = async (templatePath, newProjectPath, projectName) => {
  try {
    const filesToCreate = await fs.promises.readdir(templatePath);

    for (const file of filesToCreate) {
      const origFilePath = path.join(templatePath, file);
      const stats = await fs.promises.stat(origFilePath);

      if (stats.isFile()) {
        const writePath = path.join(CURR_DIR, newProjectPath, file);
        const fileExt = path.extname(file);

        if (
          [".js", ".jsx", ".html", ".md", ".tsx", ".yml", ".yaml"].includes(
            fileExt
          ) ||
          file.startsWith(".")
        ) {
          let contents = await fs.promises.readFile(origFilePath, "utf8");

          if ([".yml", ".yaml"].includes(fileExt)) {
            const yamlData = JSON.parse(await convertYamlToJson(contents));
            const updatedYamlData = replaceProjectNamePlaceholder(
              yamlData,
              projectName
            );
            contents = await convertJsonToYaml(updatedYamlData);
          } else {
            contents = contents.replace(
              new RegExp(PROJECT_NAME_PLACEHOLDER, "g"),
              projectName
            );
          }

          await fs.promises.writeFile(writePath, contents, "utf8");
        } else if (file === "package.json") {
          let contents = await fs.promises.readFile(origFilePath, "utf8");
          const packageJson = JSON.parse(contents);
          packageJson.name = projectName;
          await fs.promises.writeFile(
            writePath,
            JSON.stringify(packageJson, null, 2),
            "utf8"
          );
        } else {
          const readStream = fs.createReadStream(origFilePath);
          const writeStream = fs.createWriteStream(writePath);
          readStream.pipe(writeStream);
        }
      } else if (stats.isDirectory()) {
        const newDirPath = path.join(CURR_DIR, newProjectPath, file);
        await fs.promises.mkdir(newDirPath, { recursive: true });
        await generator(
          path.join(templatePath, file),
          path.join(newProjectPath, file),
          projectName
        );
      }
    }
  } catch (error) {
    console.error(error);
    throw new Error(`Error generating project: ${error.message}`);
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

const CHOICES = fs.readdirSync(`${__dirname}/templates`);

const QUESTIONS = [
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
    choices: CHOICES,
    validate: (input) =>
      CHOICES.includes(input)
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
];

const createProject = async () => {
  try {
    const answers = await inquirer.prompt(QUESTIONS);
    const {
      "project-choice": projectChoice,
      "project-name": projectName,
      "install-deps": installDeps,
      "init-git": initGit,
    } = answers;

    let finalProjectName = projectName;
    if (projectName === ".") {
      const currentDirName = path.basename(CURR_DIR);
      console.log(
        colorize(
          `Using current directory name '${currentDirName}' as the project name.`,
          "yellow"
        )
      );
      finalProjectName = currentDirName;
    }

    const templatePath = path.join(__dirname, "templates", projectChoice);
    const projectPath = path.join(CURR_DIR, finalProjectName);

    if (fs.existsSync(projectPath)) {
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
        return;
      } else {
        fs.rmdirSync(projectPath, { recursive: true });
        console.log(
          colorize(
            `Removed existing directory '${finalProjectName}'.`,
            "yellow"
          )
        );
      }
    }

    await fs.promises.mkdir(projectPath, { recursive: true });
    console.log(
      colorize(`Created project directory at ${projectPath}`, "green")
    );

    console.log(
      colorize(
        `Creating project '${finalProjectName}' from template '${projectChoice}'...`,
        "cyan"
      )
    );
    await generator(templatePath, finalProjectName, finalProjectName);

    console.log(
      colorize(`Project '${finalProjectName}' generated successfully!`, "green")
    );

    if (installDeps) {
      const packageManagerAnswer = await inquirer.prompt([
        {
          name: "package-manager",
          type: "list",
          message: "Select a package manager:",
          choices: ["npm", "yarn"],
        },
      ]);
      const packageManager = packageManagerAnswer["package-manager"];
      console.log(
        colorize(`Installing dependencies with ${packageManager}...`, "cyan")
      );
      const installCommand =
        packageManager === "yarn"
          ? "yarn install"
          : "npm install --legacy-peer-deps";
      execSync(installCommand, { cwd: projectPath, stdio: "inherit" });
      console.log(colorize("Dependency installation completed.", "green"));
    }

    if (initGit) {
      console.log(colorize(`Initializing Git repository...`, "cyan"));
      execSync("git init", { cwd: projectPath, stdio: "inherit" });
      console.log(
        colorize(`Git repository initialized successfully!`, "green")
      );
    }

    console.log(colorize("All set! Happy coding!", "green"));
  } catch (error) {
    console.error(error);
    console.log(
      colorize("An error occurred while generating the project.", "red")
    );
  }
};

createProject();
