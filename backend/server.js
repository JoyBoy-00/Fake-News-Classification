const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Add this before routes
app.use(
  cors({
    origin: `${process.env.NEXT_PUBLIC_FRONTEND_URL}`, // your frontend domain
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());

app.post("/predict", (req, res) => {
  const input = JSON.stringify(req.body); // JSON: { texts: ["..."] }

  const pythonProcess = spawn("/home/vivi/anaconda3/bin/python", ["predict.py"]);


  let result = "";

  pythonProcess.stdin.write(input);
  pythonProcess.stdin.end();

  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on("data", (err) => {
    console.error("Python error:", err.toString());
  });

  pythonProcess.on("close", () => {
    try {
      const output = JSON.parse(result);
      res.json(output);
    } catch (err) {
      console.error("JSON parse error:", err);
      res.status(500).json({ error: "Invalid response from model" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});