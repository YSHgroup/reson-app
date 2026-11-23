const { randomUUID } = require('node:crypto')
const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to start the chat server.')
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function saveDirectMessage(message, authenticatedEmail) {
  if (
    !message ||
    typeof message.author !== 'string' ||
    typeof message.to !== 'string' ||
    typeof message.content !== 'string' ||
    message.author !== authenticatedEmail
  ) {
    throw new Error('Invalid direct message.')
  }
  const users = await pool.query(
    'SELECT id, email FROM "User" WHERE email = ANY($1::text[])',
    [[message.author, message.to]]
  )
  const author = users.rows.find((user) => user.email === message.author)
  const recipient = users.rows.find((user) => user.email === message.to)
  if (!author || !recipient) throw new Error('Message sender or recipient was not found.')

  const id = randomUUID()
  const metadata = {
    date: message.date,
    time: message.time,
    reactEmoji:
      message.reactEmoji && typeof message.reactEmoji === 'object'
        ? message.reactEmoji
        : {},
  }
  await pool.query(
    `INSERT INTO "DirectMessage"
      ("id", "authorId", "recipientId", "content", "type", "read", "metadata")
     VALUES ($1, $2, $3, $4, $5, FALSE, $6::jsonb)`,
    [id, author.id, recipient.id, message.content, message.type || 'text', JSON.stringify(metadata)]
  )
  return { ...message, _id: id, read: false }
}

async function markDirectMessageRead(messageId, recipientEmail) {
  if (typeof messageId !== 'string' || typeof recipientEmail !== 'string') {
    throw new Error('Invalid read-message request.')
  }
  await pool.query(
    `UPDATE "DirectMessage"
     SET "read" = TRUE
     WHERE "id" = $1
       AND "recipientId" = (SELECT "id" FROM "User" WHERE "email" = $2)`,
    [messageId, recipientEmail]
  )
}

module.exports = { pool, saveDirectMessage, markDirectMessageRead }
