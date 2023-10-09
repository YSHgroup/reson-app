import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
var pos = require('pos');
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('./uploads/needFiles')) {
            fs.mkdirSync('./uploads/needFiles', { recursive: true });
        }
        cb(null, './uploads/needFiles')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix)
    }
});
const uploadMiddleware = multer({ storage: storage }).single('file');

export const config = {
    api: {
        bodyParser: false
    },
};

export default async function handler(req: any, res: NextApiResponse) {
    try {
        const session = await getServerSession(req, res, authOptions)
        if (session == undefined){
            return res.status(RS.CERROR_UNAUTHORIZED).json({
                message: 'Unauthorized',
            })
        }
        uploadMiddleware(req as any, res as any, async function (err: any) {
            if (err instanceof multer.MulterError) {
                return res.status(RS.SERROR_INTERNAL).json({
                    message: err,
                })
            } else if (err) {
                // An unknown error occurred when uploading.
                return res.status(RS.SERROR_INTERNAL).json({
                    message: err,
                })
            }
            const fields = JSON.parse(req.body.fields);
            const uploadedFileName = req.file.filename;
            const client = await connectToDatabase();
            const needCollection = client.db().collection('needs');
            try {
                const result = await needCollection.insertOne({
                    author: session?.user?.email,
                    title: fields.title,
                    experience: fields.experience,
                    often: fields.often,
                    from: fields.from,
                    desc: fields.desc,
                    payType: fields.payType,
                    until: fields.until,
                    when: fields.when,
                    file: uploadedFileName,
                    location:fields.location,
                    price:fields.price,
                    created_at: Date.now(),
                })
                client.close();
                res.status(200).send({ message: "success" });
            } catch (error) {
                res.status(500).send({ error: 'Failed to upload file' });
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'Failed to upload file' });
    }
}
