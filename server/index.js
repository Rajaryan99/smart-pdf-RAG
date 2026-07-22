import express from 'express';
import 'dotenv/config';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs'
import {GoogleGenAI} from '@google/genai';
import { QdrantClient } from "@qdrant/js-client-rest";





const app = express();
const port = process.env.PORT;

app.use(express.json())

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})

async function createEmbadding(text){
     const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
    });


    return response.embeddings[0].values

}


const client = new QdrantClient({
  url: process.env.QDRENT_URL,
  apiKey: process.env.QDRENT_API_KEY,
});




const upload = multer({dest: 'uploads/'})

app.get('/', (req, res) => {
    res.send("Hello, I am smart PDF. Just uploade the PDF and  can chat with me!!!")
})

app.get('/createCollection', async (req, res) => {
    try {
        await client.createCollection('pdf-dcos', {
            vectors: {
                size: 3072,
                distance: 'Cosine'
            },
        })

        res.send('collection is created')
        
    } catch (error) {
        console.error(error);
        res.status(500).send('failed to create collection')
    }
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
    const chunks = pdfText.split('\n\n').filter((chunk) => chunk.trim() != '')


    // creating and storing all the  embadding in vector
    const chunkEmbaddings = []
    for(const chunk of chunks){
        const embadding = await createEmbadding(chunk)

        chunkEmbaddings.push({
            text: chunk,
            embadding
        })
    }

    const points = chunkEmbaddings.map((item, index) => ({
        id: index + 1,
        vector: item.embadding,
        payload: {
            text: item.text
        },
    }))

    //storing the embaddings in the qdrant DB
    await client.upsert('pdf-dcos', {
        points
    })

    function cosineSimilarity(vecA, vecB){
        let dotProduct = 0;

        for(let i = 0; i < vecA.length; i++){
            dotProduct += vecA[i] * vecB[i]
        }

        return dotProduct;
    }



        const question = req.body.question;
        const questionEmbadding = await createEmbadding(question)

        // let bestChunk = null;
        // let bestScore = -Infinity;

        // for(const items of chunkEmbaddings){
        //     const score = cosineSimilarity(questionEmbadding, items.embadding);
        //     if(score > bestScore){
        //         bestChunk = items.text;
        //         bestScore = score;
        //     }
        // }

        // console.log(bestScore)

        const searchResult  = await client.search('pdf-dcos', {
            vector: questionEmbadding,
            limit: 1
        })

        // console.log(searchResult)

    // const matchChunks = chunks.find((chunk) => chunk.toLowerCase().includes(question))



        const bestChunk = searchResult[0].payload.text

        
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Answer the question using this context: ${bestChunk} and question is ${question}`
    })


    res.send(response.text)
  
        
    } catch (error) {

        console.error('PDF uploade error', error);
    
        
    }

 



})

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`)
})



