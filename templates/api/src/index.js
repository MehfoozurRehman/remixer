const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const auth = require("./middleware/auth");
const user = require("./routes/user");

// API config
dotenv.config();
const app = express();
const port = process.env.PORT || 9000;

// Middleware
app.enable("trust proxy");
app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use(express.static("public"));

// DB config
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((error) => {
    console.log("Database connection failed. Exiting now...");
    console.error(error);
    process.exit(1); // Exit the application on database connection failure
  });

// API endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the API",
  });
});

app.use("/", user);

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌");
});

// app.post("/upload", (req, res) => {
//   if (!req.files || Object.keys(req.files).length === 0) {
//     return res.status(400).json({ message: "No files were uploaded." });
//   }

//   const file = req.files.foo;

//   // Perform file validation here if needed

//   // Save the file to the "public" folder
//   file.mv(__dirname + "/public/" + file.name, (error) => {
//     if (error) {
//       console.error(error);
//       return res.status(500).json({ message: "Failed to upload file." });
//     }

//     res.status(200).json({ message: "File uploaded successfully." });
//   });
// });

app.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "No files were uploaded." });
  }

  const files = Object.values(req.files); // Get an array of all uploaded files

  // Perform file validation here if needed

  const uploadPromises = [];

  // Save each file to the "public" folder and create an array of promises
  files.forEach((file) => {
    const uploadPromise = new Promise((resolve, reject) => {
      file.mv(__dirname + "/public/" + file.name, (error) => {
        if (error) {
          console.error(error);
          reject({ file: file.name, status: "Failed" });
        } else {
          resolve({ file: file.name, status: "Success" });
        }
      });
    });

    uploadPromises.push(uploadPromise);
  });

  // Wait for all files to be uploaded and send the response
  Promise.all(uploadPromises)
    .then((results) => {
      res
        .status(200)
        .json({ message: "Files uploaded successfully.", results });
    })
    .catch((error) => {
      res.status(500).json({ message: "Failed to upload files.", error });
    });
});

app.get("*", auth, (req, res) =>
  res.status(404).json({ message: "404 page not found" })
);

// Listeners
app.listen(port, () => console.log(`Server is running on port ${port}`));
