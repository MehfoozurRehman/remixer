import { execSync } from "child_process";
import fs from "fs/promises";
import { minify } from "terser";

const publish = async () => {
  try {
    const packageJson = await fs.readFile("package.json", "utf8");
    const packageJsonData = JSON.parse(packageJson);
    const currentVersion = packageJsonData.version;
    const versionParts = currentVersion.split(".");
    versionParts[2] = parseInt(versionParts[2]) + 1;
    const newVersion = versionParts.join(".");
    packageJsonData.version = newVersion;
    await fs.writeFile(
      "package.json",
      JSON.stringify(packageJsonData, null, 2),
      "utf8"
    );

    const indexJs = await fs.readFile("index.js", "utf8");
    const minifiedIndexJs = (await minify(indexJs)).code;
    await fs.writeFile("index.min.js", minifiedIndexJs, "utf8");

    execSync("git add .");
    execSync(`git commit -m "chore: bump version to ${newVersion}"`);
    execSync(`git tag -a v${newVersion} -m "v${newVersion}"`);
    execSync("git push");

    console.log(`Ready to publish v${newVersion}!`);
    console.log("Run `npm publish` to publish the new version.");
  } catch (error) {
    console.error(error);
  }
};

publish();
