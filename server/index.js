import express from 'express';
import 'dotenv/config';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs'




const app = express();
const port = process.env.PORT;

app.use(express.json())


const upload = multer({dest: 'uploads/'})

app.get('/', (req, res) => {
    res.send("Hello, I am smart PDF. Just uploade the PDF and  can chat with me!!!")
})

app.post('/upload', upload.single('pdf'), async (req, res) => {
    console.log(req.file)

    console.log(req.body)
    console.log(req.file)

    if(!req.file){
        return res.status(400).json({error: 'no PDFfile uploaded'})
    }

    const bufferData = fs.readFileSync(req.file.path)
    const pdfData = await pdfParse(bufferData);
    const pdfText = pdfData.text;

    // sending data in chunks

    const chunks = pdfText.split('\n\n')

   res.json({
        totalChunks: chunks.length,
        chunks
   })



})

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`)
})



