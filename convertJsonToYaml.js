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

export default convertJsonToYaml;
