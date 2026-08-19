const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to parse CSV lines with quoted commas
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^"|"$/g, ''));
};

app.get('/api/scrape', (req, res) => {
  const query = req.query.query || 'construction';
  const location = req.query.location || 'chennai';
  const limit = req.query.limit || '10';

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  console.log(`[Server] Starting ${pythonCmd} scraper.py "${query}" "${location}" ${limit}`);
  
  const pythonProcess = spawn(pythonCmd, ['scraper.py', query, location, limit]);

  let stdoutData = '';
  let stderrData = '';

  pythonProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    console.log(`[Server] Process exited with code ${code}`);
    if (code !== 0) {
      return res.status(500).json({ 
        success: false, 
        error: `Scraper exited with code ${code}`,
        stderr: stderrData 
      });
    }

    const csvPath = path.resolve(__dirname, 'leads.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(500).json({ success: false, error: 'leads.csv not generated' });
    }

    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length === 0) {
      return res.json({ success: true, leads: [] });
    }

    const headers = parseCSVLine(lines[0]);
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = values[index] ? values[index] : 'N/A';
      });
      results.push(entry);
    }

    res.json({ success: true, leads: results, logs: stdoutData });
  });
});

app.listen(PORT, () => {
  console.log(`Scraper backend listening on port ${PORT}`);
});
