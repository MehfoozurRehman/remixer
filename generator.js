import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const CURR_DIR = process.cwd();
const PROJECT_NAME_PLACEHOLDER = 'project_name';

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
          fileExt === '.js' ||
          fileExt === '.jsx' ||
          fileExt === '.html' ||
          fileExt === '.md' ||
          fileExt === '.tsx' ||
          fileExt === '.yml' ||
          fileExt === '.yaml'
        ) {
          let contents = await fs.promises.readFile(origFilePath, 'utf8');

          if (fileExt === '.yml' || fileExt === '.yaml') {
            // Replace project name placeholder in YAML files
            const yamlData = yaml.load(contents);
            const updatedYamlData = replaceProjectNamePlaceholder(yamlData, projectName);
            contents = yaml.dump(updatedYamlData);
          } else {
            // Replace project name placeholder in other file types
            contents = contents.replace(new RegExp(PROJECT_NAME_PLACEHOLDER, 'g'), projectName);
          }

          await fs.promises.writeFile(writePath, contents, 'utf8');
        } else if (file === 'package.json') {
          // Replace project name placeholder in package.json
          let contents = await fs.promises.readFile(origFilePath, 'utf8');
          const packageJson = JSON.parse(contents);
          packageJson.name = projectName;
          await fs.promises.writeFile(writePath, JSON.stringify(packageJson, null, 2), 'utf8');
        } else {
          // Copy other files as-is
          const readStream = fs.createReadStream(origFilePath);
          const writeStream = fs.createWriteStream(writePath);
          readStream.pipe(writeStream);
        }
      } else if (stats.isDirectory()) {
        const newDirPath = path.join(CURR_DIR, newProjectPath, file);
        await fs.promises.mkdir(newDirPath);

        await generator(
          path.join(templatePath, file),
          path.join(newProjectPath, file),
          projectName
        );
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

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

export default generator;
