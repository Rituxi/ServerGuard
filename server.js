import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Essential for Zeabur/PaaS to correctly identify protocol (http/https)
app.enable('trust proxy');

app.use(cors());
// Explicitly handle OPTIONS for all routes to prevent 405 on preflight
app.options('*', cors());

app.use(express.json());

// Log every request to help debug routing issues
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Ensure public directory exists immediately on startup
const publicDir = path.join(__dirname, 'public');
console.log(`System Public Directory: ${publicDir}`);

try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('Created public directory successfully.');
  } else {
    console.log('Public directory already exists.');
  }
} catch (err) {
  console.error('CRITICAL ERROR: Failed to create public directory:', err);
}

// Configure storage for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(publicDir)) {
      try {
        fs.mkdirSync(publicDir, { recursive: true });
      } catch (err) {
        return cb(err);
      }
    }
    cb(null, publicDir);
  },
  filename: function (req, file, cb) {
    try {
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      cb(null, originalName);
    } catch (e) {
      cb(null, file.originalname);
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// --- API ROUTES ---

// API: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', runtime: 'node', timestamp: Date.now() });
});

// API: List assets
app.get('/api/assets', (req, res) => {
  if (!fs.existsSync(publicDir)) {
    return res.json([]);
  }

  fs.readdir(publicDir, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send({ message: 'Unable to scan files!' });
    }

    const fileInfos = files
      .filter(file => /\.(png|jpe?g|gif|webp)$/i.test(file))
      .map(file => {
        const filePath = path.join(publicDir, file);
        let size = 0;
        try {
            const stats = fs.statSync(filePath);
            size = stats.size;
        } catch (e) {}

        return {
          name: file,
          url: `/${file}`,
          size: size
        };
      });

    res.json(fileInfos);
  });
});

// API: Upload (v2 to bypass cache/routing issues)
app.post('/api/v2/upload', (req, res) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer Upload Error:', err);
      return res.status(500).json({ message: `Upload Error: ${err.message}` });
    } else if (err) {
      console.error('Unknown Upload Error:', err);
      return res.status(500).json({ message: `System Error: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    console.log(`File uploaded: ${req.file.filename} (${req.file.size} bytes)`);
    res.send({ 
      message: 'File uploaded successfully', 
      filename: req.file.filename,
      url: `/${req.file.filename}`
    });
  });
});

// API: Rename
app.put('/api/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).send({ message: 'Missing filename.' });

  const oldPath = path.join(publicDir, oldName);
  const newPath = path.join(publicDir, newName);

  if (newName.includes('..') || newName.includes('/') || newName.includes('\\')) {
     return res.status(400).send({ message: 'Invalid filename.' });
  }

  if (!fs.existsSync(oldPath)) return res.status(404).send({ message: 'File not found.' });
  if (fs.existsSync(newPath)) return res.status(409).send({ message: 'File already exists.' });

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      console.error('Rename Error:', err);
      return res.status(500).send({ message: `Rename failed: ${err.message}` });
    }
    res.send({ message: 'File renamed successfully.', newName, url: `/${newName}` });
  });
});

// API: Delete
app.delete('/api/delete/:filename', (req, res) => {
  const filePath = path.join(publicDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Delete Error:', err);
        return res.status(500).send({ message: `Delete failed: ${err.message}` });
      }
      res.send({ message: 'File deleted successfully.' });
    });
  } else {
    res.status(404).send({ message: 'File not found.' });
  }
});

// --- STATIC FILES ---
// Serve uploaded images
app.use(express.static(publicDir));

// Serve React App
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

// SPA Fallback: Send index.html for any other requests
// This must be LAST
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
     res.sendFile(path.join(distDir, 'index.html'));
  } else {
     res.status(404).send('App not built. Please run npm run build.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ServerGuard Node.js Server running on port ${PORT}`);
});
