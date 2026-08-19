import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// Helper to parse CSV lines with quoted commas
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
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

// Custom plugin to handle local python scraping requests
const localScraperPlugin = () => ({
  name: 'local-scraper-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/api/scrape')) {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const query = url.searchParams.get('query') || 'construction';
        const location = url.searchParams.get('location') || 'chennai';
        const limit = url.searchParams.get('limit') || '10';

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });

        console.log(`[API Scrape] Starting python scraper.py "${query}" "${location}" ${limit}`);
        
        // Spawn the python process
        const pythonProcess = spawn('python', ['scraper.py', query, location, limit]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (data) => {
          stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
        });

        pythonProcess.on('close', (code: number) => {
          console.log(`[API Scrape] Python process exited with code ${code}`);
          if (code !== 0) {
            res.end(JSON.stringify({ 
              success: false, 
              error: `Scraper exited with code ${code}`,
              stderr: stderrData 
            }));
            return;
          }

          // Read the output leads.csv file
          const csvPath = path.resolve(process.cwd(), 'leads.csv');
          if (!fs.existsSync(csvPath)) {
            res.end(JSON.stringify({ success: false, error: 'leads.csv not generated' }));
            return;
          }

          const csvData = fs.readFileSync(csvPath, 'utf8');
          const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          
          if (lines.length === 0) {
            res.end(JSON.stringify({ success: true, leads: [] }));
            return;
          }

          const headers = parseCSVLine(lines[0]);
          const results: any[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const entry: any = {};
            headers.forEach((header, index) => {
              entry[header] = values[index] ? values[index] : 'N/A';
            });
            results.push(entry);
          }

          res.end(JSON.stringify({ success: true, leads: results, logs: stdoutData }));
        });
        
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localScraperPlugin()
  ],
  server: {
    watch: {
      ignored: ['**/*.csv', '**/*.png']
    }
  }
})
