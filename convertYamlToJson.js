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

export default convertYamlToJson;
