import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getSession } from 'next-auth/react';
import { prisma } from '@lib/prisma'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || '';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const session = await getSession({ req })
    const email = session?.user?.email
    if (!email) return res.status(401).json({ message: 'Unauthorized.' })
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) return res.status(401).json({ message: 'Unauthorized.' })

    const contacts = (data.connections ?? [])
      .filter((item) => typeof item.resourceName === 'string')
      .map((item) => ({
        userId: user.id,
        googleResourceName: item.resourceName!,
        displayName: item.names?.[0]?.displayName ?? null,
        email: item.emailAddresses?.[0]?.value ?? null,
        photoUrl: item.photos?.[0]?.url ?? null,
        birthday: item.birthdays?.[0]?.text ?? null,
        phoneNumber: item.phoneNumbers?.[0]?.canonicalForm ?? null,
      }))
    if (contacts.length) {
      await prisma.contact.createMany({ data: contacts, skipDuplicates: true })
    }
    const uri = process.env.CONTACT_REDIRECT_URI || '';
    res.redirect(uri);
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    res.status(500).end();
  }
}

export default handler