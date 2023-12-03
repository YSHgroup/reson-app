import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session: any = await getServerSession(req as any, res as any, authOptions as any)
    var today = new Date()
    var Y = today.getFullYear()
    var M = today.getMonth() + 1
    var D = today.getDate()
    var h = today.getHours()
    var m = today.getMinutes()
    var s = today.getSeconds()
    var current_date = Y + '/' + M + '/' + D
    var current_time = h + ':' + m + ':' + s
    if (session == undefined)
        return res.status(RS.CERROR_UNAUTHORIZED).json({
            message: 'Unauthorized',
        })

    if (req.method !== 'POST') {
        return res.status(RS.CERROR_FORBIDDEN).json({
            message: 'Wrong HTTP Method',
        })
    }
    const data = req.body;
    const client = await connectToDatabase()
    const calendarCollection = client.db().collection('calendar');
    const messagesCollection = client.db().collection('messages');
    const author = session?.user?.email;
    try {
        const schedules = await calendarCollection.find({
            $or: [
                { author: author },
                { to: author }
            ],
        }).toArray();
        const currentDate = new Date(data.currentDate);
        const plusFiveMinutes = new Date(data.plusFiveMinutes);
        for (let i = 0; i < schedules.length; i++) {
            let startdate = new Date(schedules[i].startdate);
            if (startdate >= currentDate && startdate <= plusFiveMinutes) {
                const countTo = await messagesCollection.countDocuments({
                    $and: [
                        { author: schedules[i].author },
                        { content: "Hi \n Just wanted to remind you that you have plans coming up in the next 5 minutes. \n Don't forget to get ready and be there on time! \n Have a great time!" },
                        { to: schedules[i].to}
                    ]
                });
                if(countTo === 0) {
                    let messageTo: any = {};
                    messageTo['author'] = schedules[i].author;
                    messageTo['content'] = `Hi \n Just wanted to remind you that you have plans coming up in the next 5 minutes. \n Don't forget to get ready and be there on time! \n Have a great time!`;
                    messageTo['to'] = schedules[i].to;
                    messageTo['date'] = data.currentDate;
                    messageTo['time'] = current_time;
                    messageTo['read'] = false;
                    messageTo['type'] = 'text';
                    await messagesCollection.insertOne(messageTo);
                } 

            }
        }

        client.close();
        return res.status(200).json({
            message: "Success",
        })
    } catch (error) {
        client.close()
        return res.status(RS.SERROR_INTERNAL).json({
            message: error,
        })
    }
}

export default handler
function ArrayPush() {
    throw new Error('Function not implemented.')
}

