import express from 'express';
import 'dotenv/config';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs'
import {GoogleGenAI} from '@google/genai';




const app = express();
const port = process.env.PORT;

app.use(express.json())

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})


const upload = multer({dest: 'uploads/'})

app.get('/', (req, res) => {
    res.send("Hello, I am smart PDF. Just uploade the PDF and  can chat with me!!!")
})

app.post('/upload', upload.single('pdf'), async (req, res) => {
  

    if(!req.file){
        return res.status(400).json({error: 'no PDFfile uploaded'})
    }

    try {

           const bufferData = fs.readFileSync(req.file.path)
    const pdfData = await pdfParse(bufferData);
    const pdfText = pdfData.text;

    // sending data in chunks

    const chunks = pdfText.split('\n\n')

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Explain the PDF in simple text ${chunks[1]}`
    })


    res.send(response.text)
  
        
    } catch (error) {

        // console.error('PDF uploade error', error);
        // // res.status(500).json({
        // //     message:'',
        // // })
        
    }

 



})

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`)
})



