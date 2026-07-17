import express from 'express';
import 'dotenv/config';
import multer from 'multer';




const app = express();
const port = process.env.PORT;

app.use(express.json())


const upload = multer({dest: 'uploads/'})

app.get('/', (req, res) => {
    res.send("Hello, I am smart PDF. Just uploade the PDF and  can chat with me!!!")
})

app.post('/upload', upload.single('pdf'), (req, res) => {
    console.log(req.file)
    res.send('file uploaded successfully')
})

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`)
})



