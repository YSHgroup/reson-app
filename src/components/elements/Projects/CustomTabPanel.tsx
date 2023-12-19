import React, { useEffect, useState } from 'react'
import ProjectsItems from './ProjectItems'
import ApplyItems from './ApplyItems'
import Search from './Search'
import Favorites from './Favorites'
import { useAtom } from 'jotai'
import { favorIdAtom } from 'atoms'

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
  const [favorIds, setFavorId] = useAtom(favorIdAtom)
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

  const getFavorites = async () => {
    try {
      const response = await fetch('/api/favorite/get-favorites', {
        method: 'GET',
      })
      const personalFavor = await response.json()
      setFavorId(personalFavor.favorites)
    } catch (err) {
      console.log('It seems to be no favorite items you have.', err)
    }
  }

  useEffect(() => {
    getFavorites()
  }, [])
  useEffect(() => {
    if (!value) {
      getProjects()
    } else if (value === 3) {
    } else {
      getApplyItems()
    }
  }, [value])

  return (
    <div
      role="tabpanel"
      style={{ width: '100%' }}
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}>
      {value === 0 && <ProjectsItems lists={projectLists} />}
      {value === 1 && <ApplyItems lists={applyLists} />}
      {value === 2 && <Search onItemChange={getFavorites} />}
      {value === 3 && <Favorites lists={favorIds} onItemChange={getFavorites} />}
    </div>
  )
}
