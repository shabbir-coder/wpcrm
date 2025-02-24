const fs = require('fs');
const path = require('path');

exports.uploadChunk = (req, res) => {
    const { index, totalChunks, fileName } = req.body;
    const chunk = req.file;

    if (!chunk) {
        return res.status(400).json({ message: 'No chunk uploaded.' });
    }

    const tempDir = path.join(__dirname, '../../uploads/temp', fileName);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `chunk-${index}`);
    fs.writeFileSync(chunkPath, chunk.buffer);

    res.json({ message: `Chunk ${index} uploaded successfully` });
};


exports.mergeChunks = (req, res) => {
    const { fileName } = req.body;
    const tempDir = path.join(__dirname, '../../uploads/temp', fileName);
    const finalFilePath = path.join(__dirname, '../../uploads', fileName);

    if (!fs.existsSync(tempDir)) {
        return res.status(400).json({ message: 'Chunks not found.' });
    }

    const chunkFiles = fs.readdirSync(tempDir).sort((a, b) => {
        return parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]);
    });

    const writeStream = fs.createWriteStream(finalFilePath);
    chunkFiles.forEach(chunk => {
        const chunkPath = path.join(tempDir, chunk);
        const chunkData = fs.readFileSync(chunkPath);
        writeStream.write(chunkData);
        fs.unlinkSync(chunkPath);
    });

    writeStream.end();
    fs.rmdirSync(tempDir);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${fileName}`;

    res.json({ message: 'File merged successfully', filePath: fileUrl });
};
