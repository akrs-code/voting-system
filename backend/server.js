import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'

dotenv.config()

const app = express()
app.use(helmet())

app.use(express.json())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to the database"))

app.listen(process.env.PORT, () => console.log(`The server is running at PORT ${process.env.PORT}`))