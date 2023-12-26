import { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || '';
const SCOPES = [process.env.SCOPES || 'https://www.googleapis.com/auth/contacts.readonly'];

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });
        // console.log(authUrl, 'authUrl')
        res.redirect(authUrl);
    } catch(e) {
        console.log(e, 'eee')
    }
}

export default handler
