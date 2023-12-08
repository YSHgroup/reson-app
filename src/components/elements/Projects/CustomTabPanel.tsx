import React, { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import ProjectsItems from './ProjectItems'
import ApplyItems from './ApplyItems'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}
interface ListObject {
  _id: string | null
  author: string | null
  title: string | null
  startLine: string | null
  deadLine: string | null
  price: number | null
  description: string | null
  payType: string | null
  file: string | null
  where: string | null
  exist: number | null
  created_at: string | null
  payUnit: string | null
  role: string | null
  count: number | null
}
interface ApplyObject {
  author: string | null
  created_at: string | null
  need_id: ListObject | null
  poster: string | null
  _id: string | null
}
export default function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  const [projectLists, setProjectLists] = useState<ListObject[]>([])
  const [applyLists, setApplyLists] = useState<ApplyObject[]>([])

  const getProjects = async () => {
    try {
      const response = await fetch('/api/need/get_projects', {
        method: 'POST',
      })
      const JSON_response = await response.json()
      setProjectLists(JSON_response.data)
    } catch (err) {
      console.log(err)
    }
  }

  const getApplyItems = async () => {
    try {
      const response = await fetch('/api/can/getMyApplyLists', {
        method: 'POST',
      })
      const data = await response.json()
      setApplyLists(data.results)
    } catch (err) {
      console.log(err)
    }
  }
  useEffect(() => {
    if (!value) {
      getProjects()
    } else {
      getApplyItems()
    }
  }, [value])

  return (
    <div
      role="tabpanel"
      style={{width: '100%'}}
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}>
      {value === 0 && <ProjectsItems lists={projectLists} />}
      {value === 1 && <ApplyItems lists={applyLists} />}
      {value === 2 && <ApplyItems lists={applyLists} />}
      {value === 3 && <ApplyItems lists={applyLists} />}
    </div>
  )
}
