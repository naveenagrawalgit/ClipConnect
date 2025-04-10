import express from "express";
import cookieParser from "cookie-parser"; // to preform crud on cookie of user
import cors from 'cors'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true
}))

app.use(express.json({limit: "16kb"})) // to limit json passed when data comes from form handling.


app.use(express.urlencoded({extended : true, limit: "16kb"})) //for parsing URL-encoded data, such as form submissions

app.use(express.static("public")) // public folder for storing files and different docs

app.use(cookieParser())


export default app