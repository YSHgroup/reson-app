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
        if (!fs.existsSync('./uploads/chats')) {
            fs.mkdirSync('./uploads/chats', { recursive: true });
        }
        cb(null, './uploads/chats')
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
        var today = new Date();
        const session = await getServerSession(req, res, authOptions)
        if (session == undefined) {
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
            const members = [session?.user?.email, ...fields.people.map((onePeople: { email: any }) => onePeople.email)];
            const client = await connectToDatabase();
            const groupchatCollection = client.db().collection('groupchat');
            try {
                const result = await groupchatCollection.insertOne({
                    title: fields.groupName,
                    owner: session?.user?.email,
                    groupAvatar: uploadedFileName,
                    members,
                    created: today,
                    modified: today
                })
                client.close();
                return res.status(200).send({ message: "Success" });
            } catch (error) {
                return res.status(500).send({ error: 'Failed to upload file' });
            }
        })
    } catch (error) {
        return res.status(500).send({ error: 'Failed to upload file' });
    }
}
