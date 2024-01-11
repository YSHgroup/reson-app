// import {} from 'react'
import { withAdminProtection } from "@lib/withAdminProtection"
import { NextApiRequest, NextApiResponse } from "next"
import { getSession } from "next-auth/react"

const AdminPage = ({session}) => {
    console.log('session in admin page: ', session)
    return (
        <h1>
            Administrator
        </h1>
    )
}

export const getServerSideProps = async ({ req, res }: {
    req: NextApiRequest, res: NextApiResponse
}) => {
    const session = await getSession({req})
    if(!session){
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }
    return {
        props: {
            session
        }
    }
}

export default withAdminProtection(AdminPage)