import {
  Badge,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import PersonalVideoIcon from '@mui/icons-material/PersonalVideo';
import { DesktopAccessDisabled } from '@mui/icons-material';

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

const ProjectsItems = ({ lists }) => {
  return (
    <List
      sx={{
        width: '100%',
      }}>
      {lists.map((list: ListObject, i: number) => (
        <div key={list._id}>
          <ListItemButton
            key={list._id}
            LinkComponent={Link}
            href={`/projects/${list._id}`}>
            <Stack sx={{ flexGrow: 1 }}>
              <Typography variant="h5">{list.title}</Typography>
              <Typography variant="h6">
                {list.price} {list.payUnit.toUpperCase()}
              </Typography>
            </Stack>
            {
              list.exist ? (
                <IconButton
                  aria-label='comment'
                >
                  <PersonalVideoIcon />
                </IconButton>
              ) : (
                <IconButton
                  aria-label='comment'
                >
                  <DesktopAccessDisabled />
                </IconButton>
              )
            }
            <Badge badgeContent={list.count} color="success">
              <Image
                src="/images/turnon.png"
                alt="turnon"
                width={40}
                height={40}
              />
            </Badge>
          </ListItemButton>
          <Divider />
        </div>
      ))}
    </List>
  )
}
export default ProjectsItems
