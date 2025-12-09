import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing for API requests (e.g. rename)
app.use(express.json());

// Configure storage for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public');
    // Ensure public directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Keep original filename to prevent renaming
    // Decode URI component to handle Chinese characters correctly
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, originalName);
  }
});

const upload = multer({ storage: storage });

// Serve static files from 'public' directory (images)
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from 'dist' directory (React build)
app.use(express.static(path.join(__dirname, 'dist')));

// API: List all assets in public folder
app.get('/api/assets', (req, res) => {
  const directoryPath = path.join(__dirname, 'public');
  
  if (!fs.existsSync(directoryPath)) {
    return res.json([]);
  }

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send({ message: 'Unable to scan files!' });
    }

    // Filter for images only
    const fileInfos = files
      .filter(file => /\.(png|jpe?g|gif|webp)$/i.test(file))
      .map(file => {
        const filePath = path.join(directoryPath, file);
        let size = 0;
        try {
            const stats = fs.statSync(filePath);
            size = stats.size;
        } catch (e) {
            console.error('Error reading file stats', e);
        }

        return {
          name: file,
          url: `/${file}`,
          size: size // Add file size in bytes
        };
      });

    res.json(fileInfos);
  });
});

// API: Upload a file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send({ 
    message: 'File uploaded successfully', 
    filename: req.file.filename,
    url: `/${req.file.filename}`
  });
});

// API: Rename a file
app.put('/api/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).send({ message: 'Missing filename.' });
  }

  const oldPath = path.join(__dirname, 'public', oldName);
  const newPath = path.join(__dirname, 'public', newName);

  // Simple validation
  if (newName.includes('..') || newName.includes('/') || newName.includes('\\')) {
     return res.status(400).send({ message: 'Invalid filename.' });
  }

  if (!fs.existsSync(oldPath)) {
    return res.status(404).send({ message: 'File not found.' });
  }
  
  if (fs.existsSync(newPath)) {
      return res.status(409).send({ message: 'File with that name already exists.' });
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      return res.status(500).send({ message: 'Could not rename file.' });
    }
    res.send({ message: 'File renamed successfully.', newName, url: `/${newName}` });
  });
});

// API: Delete a file
app.delete('/api/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', filename);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).send({ message: 'Could not delete file.' });
      }
      res.send({ message: 'File deleted successfully.' });
    });
  } else {
    res.status(404).send({ message: 'File not found.' });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from ${path.join(__dirname, 'public')}`);
});