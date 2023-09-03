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

const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/voiceMessages')
    },
    filename: function (req, file, cb) {
        cb(null, 'voiceMessage -' + uniqueSuffix)
    }
});
const upload = multer({ storage: storage }).single('file');

export const config = {
    api: {
        bodyParser: false
    },
};

export default async function handler(req: any, res: NextApiResponse) {
    try {
        upload(req as any, res as any, function (err: any) {
            console.log(err, 'err');
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
            } else if (err) {
                // An unknown error occurred when uploading.
            }
        })
        res.status(200).send({ filename: 'voiceMessage -'+ uniqueSuffix });
    } catch (error) {
        res.status(500).send({ error: 'Failed to upload file' });
    }
}
