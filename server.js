const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "NOVA AI Backend",
    message: "New backend successfully connected"
  });
});

app.post("/chat", async (req, res) => {
  res.json({
    reply: "NOVA AI backend is working. AI connection will be added next."
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`NOVA AI server running on port ${PORT}`);
});
