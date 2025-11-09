import express from "express";
import axios from "axios";

const router = express.Router();
const FLASK_URL = process.env.FLASK_URL;

// Proxy to Flask
router.get("/features", async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_URL}/features`);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching features:", err.message);
    res.status(500).json({ error: "Failed to fetch features" });
  }
});

router.post("/predict", async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_URL}/predict`, req.body);
    res.json(response.data);
  } catch (err) {
    console.error("Error calling Flask API:", err.message);
    res.status(500).json({ error: "Prediction failed" });
  }
});

export default router;
