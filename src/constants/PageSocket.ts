import React, { useEffect } from 'react'
import io from 'socket.io-client'
import { getSession, useSession } from 'next-auth/react'

const PageSocket = io(String(process.env.NEXT_PUBLIC_CHAT_URI), { secure: true });

export default PageSocket