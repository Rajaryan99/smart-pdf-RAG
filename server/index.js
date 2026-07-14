import express from 'express';
import 'dotenv/config';

const app = express();
const port = process.env.PORT;

app.use(express.json())

app.get('/', (req, res) => {
    res.send("Hello, I am smart PDF. Just uploade the PDF and  can chat with me!!!")
})

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`)
})