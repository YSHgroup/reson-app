// import {} from 'react'
import BasicLayout from "@layouts/BasicLayout"
import { withAdminProtection } from "@lib/withAdminProtection"
import { NextApiRequest, NextApiResponse } from "next"
import { getSession } from "next-auth/react"
import SideBar from "@elements/Admin/Sidebar"
const AdminPage = ({session}) => {
    return (
        <BasicLayout title="Administrator">
            <SideBar>

            </SideBar>
        <h1>
            Administrator
        </h1>
        </BasicLayout>
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

const AdminDashboard = withAdminProtection(AdminPage)
export default  AdminDashboard