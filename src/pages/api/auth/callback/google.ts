import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getSession } from 'next-auth/react';
import { connectToDatabase } from '@lib/db'
import { auth } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || '';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { code } = req.query;
  try {
    const { tokens } = await oAuth2Client.getToken(code as string);
    oAuth2Client.setCredentials(tokens);

    const people = google.people({ version: 'v1', auth: oAuth2Client });
    const { data } = await people.people.connections.list({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,birthdays,genders,phoneNumbers,photos',
      pageSize: 100,
    });
    const session = await getSession({
      req,
    })

    const client = await connectToDatabase()

    const contactsCollection = client.db().collection('contacts');
    const author = session?.user?.email;

    for (const item of data.connections ?? []) {
      const count = await contactsCollection.countDocuments({
        $and: [
          { author: author },
          { emailAddress: (item.emailAddresses !== undefined && item.emailAddresses[0]?.value) }
        ]
      });
      if (count === 0) {
        const contacts = await contactsCollection.insertOne({
          author: author,
          name: item.names !== undefined ? item.names[0]?.displayName : null,
          emailAddress: item.emailAddresses !== undefined ? item.emailAddresses[0]?.value : null,
          photo: item.photos !== undefined ? item.photos[0]?.url : null,
          birthday: item.birthdays !== undefined ? item.birthdays[0]?.text : null,
          phoneNumber: item.phoneNumbers !== undefined ? item.phoneNumbers[0]?.canonicalForm : null,
        });
      }
    }

    client.close();
    const uri = process.env.CONTACT_REDIRECT_URI || '';
    res.redirect(uri);
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    res.status(500).end();
  }
};