import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
var pos = require('pos');
import formidable from "formidable";
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// const uniqueSuffix = Date.now()+'-'+Math.round(Math.random() * 1E9)+".wav";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('./uploads/voiceMessages')) {
            fs.mkdirSync('./uploads/voiceMessages', { recursive: true });
        }
        cb(null, './uploads/voiceMessages')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now()+'-'+Math.round(Math.random() * 1E9)+".wav";
        cb(null, uniqueSuffix)
    }
});
const upload = multer({ storage: storage });

export const config = {
    api: {
        bodyParser: false
    },
};

export default async function handler(req: any, res: NextApiResponse) {
    try {
        upload.single('file')(req as any, res as any, function (err: any) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
            } else if (err) {
                // An unknown error occurred when uploading.
            }
            const uploadedFileName = req.file.filename;
            res.status(200).send({ filename: uploadedFileName });
        })
    } catch (error) {
        res.status(500).send({ error: 'Failed to upload file' });
    }
}
