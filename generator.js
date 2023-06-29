import fs from 'fs';
import path from 'path';

const CURR_DIR = process.cwd();
const NPM_IGNORE_FILE = '.npmignore';
const GIT_IGNORE_FILE = '.gitignore';

const generator = async (templatePath, newProjectPath) => {
  try {
    const filesToCreate = await fs.promises.readdir(templatePath);

    for (const file of filesToCreate) {
      const origFilePath = path.join(templatePath, file);
      const stats = await fs.promises.stat(origFilePath);

      if (stats.isFile()) {
        let targetFile = file;

        if (file === NPM_IGNORE_FILE) {
          targetFile = GIT_IGNORE_FILE;
        }

        const writePath = path.join(CURR_DIR, newProjectPath, targetFile);
        const contents = await fs.promises.readFile(origFilePath, 'utf8');
        await fs.promises.writeFile(writePath, contents, 'utf8');
      } else if (stats.isDirectory()) {
        const newDirPath = path.join(CURR_DIR, newProjectPath, file);
        await fs.promises.mkdir(newDirPath);

        await generator(path.join(templatePath, file), path.join(newProjectPath, file));
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

export default generator;
