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

async function createEmbadding(text){
     const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: 'What is the meaning of life?',
    });

    console.log('embading = ', response)

    return response.embeddings[0].values

}


const upload = multer({dest: 'uploads/'})

app.get('/', (req, res) => {
    res.send("Hello, I am smart PDF. Just uploade the PDF and  can chat with me!!!")
})

app.post('/upload', upload.single('pdf'), async (req, res) => {

    console.log(req.body)
  

    if(!req.file){
        return res.status(400).json({error: 'no PDFfile uploaded'})
    }

    try {

           const bufferData = fs.readFileSync(req.file.path)
    const pdfData = await pdfParse(bufferData);
    const pdfText = pdfData.text;




    // sending data in chunks
 
    const chunks = pdfText.split('\n\n').filter((chunk) => chunk.trim() != '')

    const embading = await createEmbadding(chunks[0])
    console.log('Question of embiding is = ', embading)

        const question = req.body.question;
    const matchChunks = chunks.find((chunk) => chunk.toLowerCase().includes(question))

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Answer the question using this context: ${matchChunks} and question is ${question}`
    })


    // res.json({
    //     matchChunks,
    //     response: response.text
    // })
  
        
    } catch (error) {

        console.error('PDF uploade error', error);
    
        
    }

 



})

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`)
})



