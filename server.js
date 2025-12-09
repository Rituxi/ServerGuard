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

app.use(cors());
app.use(express.json());

// Log every request to verify if traffic hits Node.js or gets blocked by Zeabur Static (Caddy)
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
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
    // Re-check directory existence before each upload
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
      // Decode filename for Chinese character support
      // Fallback to originalname if decoding fails/isn't needed
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      cb(null, originalName);
    } catch (e) {
      cb(null, file.originalname);
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
});

// Serve static files
app.use(express.static(publicDir));
app.use(express.static(path.join(__dirname, 'dist')));

// API: List all assets
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

// API: Upload a file (With detailed error handling)
app.post('/api/upload', (req, res) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error('Multer Upload Error:', err);
      return res.status(500).json({ message: `Upload Error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading.
      console.error('Unknown Upload Error:', err);
      return res.status(500).json({ message: `System Error: ${err.message}` });
    }

    // Everything went fine.
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

// API: Rename a file
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

// API: Delete a file
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});