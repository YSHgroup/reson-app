import type { DirectMessage, GroupMessage, Prisma } from '../generated/prisma/client'

type DirectMessageWithUsers = DirectMessage & {
  author: { email: string }
  recipient: { email: string }
}

type GroupMessageWithSender = GroupMessage & {
  sender: { email: string; nickname: string }
}

function metadataRecord(
  value: Prisma.JsonValue | null
): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function formattedDate(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate()
  ).padStart(2, '0')}/${date.getFullYear()}`
}

function formattedTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

export function toggleReaction(
  value: Prisma.JsonValue | null,
  emojiId: string,
  email: string
): Prisma.InputJsonObject {
  const record = metadataRecord(value)
  const reactions = metadataRecord(
    typeof record.reactEmoji === 'object' && record.reactEmoji !== null
      ? (record.reactEmoji as Prisma.JsonValue)
      : null
  )
  const current = Array.isArray(reactions[emojiId])
    ? reactions[emojiId].filter((person): person is string => typeof person === 'string')
    : []
  const next = current.includes(email)
    ? current.filter((person) => person !== email)
    : [...current, email]
  if (next.length) reactions[emojiId] = next
  else delete reactions[emojiId]
  return { ...record, reactEmoji: reactions } as Prisma.InputJsonObject
}

export function toLegacyDirectMessage(message: DirectMessageWithUsers) {
  const metadata = metadataRecord(message.metadata)
  return {
    ...metadata,
    _id: message.id,
    author: message.author.email,
    to: message.recipient.email,
    content: message.content,
    type: message.type,
    read: message.read,
    date:
      typeof metadata.date === 'string'
        ? metadata.date
        : formattedDate(message.createdAt),
    time:
      typeof metadata.time === 'string'
        ? metadata.time
        : formattedTime(message.createdAt),
    reactEmoji:
      metadata.reactEmoji && typeof metadata.reactEmoji === 'object'
        ? metadata.reactEmoji
        : {},
  }
}

export function toLegacyGroupMessage(message: GroupMessageWithSender) {
  const metadata = metadataRecord(message.metadata)
  return {
    ...metadata,
    _id: message.id,
    groupId: message.groupId,
    posterName: message.sender.nickname,
    posterEmail: message.sender.email,
    type: message.type,
    content: message.content,
    date:
      typeof metadata.date === 'string'
        ? metadata.date
        : formattedDate(message.createdAt),
    time:
      typeof metadata.time === 'string'
        ? metadata.time
        : formattedTime(message.createdAt),
    readers: message.readers,
    reactEmoji: message.reactions ?? {},
  }
}
