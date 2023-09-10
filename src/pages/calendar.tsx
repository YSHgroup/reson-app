import FullLayout from '@layouts/FullLayout/FullLayout'
import { Divider, ListSubheader, Tab, Tabs, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography, TextField, MenuItem, Grid, Alert, FormHelperText } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { Stack } from '@mui/material'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import languagejson from "../language.json"
import { useAtom } from 'jotai'
import { language } from "../jotai"

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import React, { useRef, useState, useEffect } from "react";
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles';

const start = new Date();
const end = new Date(new Date().setMinutes(start.getMinutes() + 30));

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
    minWidth: '50%',
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const bgColorLists = [
  {
    value: 'rgb(124, 179, 66)',
    label: 'Green'
  },
  {
    value: 'rgb(213, 0, 0)',
    label: 'Red'
  },
  {
    value: 'rgb(246, 191, 38)',
    label: 'Yellow'
  },
  {
    value: 'rgb(3, 155, 229)',
    label: 'Blue'
  },
  {
    value: 'rgb(142, 36, 170)',
    label: 'Pink'
  },
];
export default function Calendar() {

  const [lang, setLanguage] = useAtom(language)
  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState({});
  const [initValues, setInitValues] = useState({
    title: '',
    startDate: '',
    endDate: '',
    bgColor: 'rgb(124, 179, 66)',
    description: '',
  });
  const [isChange, setIsChange] = useState(false);
  const [objectId, setObjectId] = useState('');
  const calendarRef = useRef(null);



  const handleClickOpen = () => {
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
  };

  const handleCalendarSelect = (info: any) => {
    setInitValues(prevValues => ({
      ...prevValues,
      title: "Tittle",
      startDate: info.startStr,
      endDate: info.endStr
    }));
    setObjectId('');
    setIsChange(false);
    setModalOpen(true);
  }

  const handleEventSelect = (info: any) => {
    setInitValues(prevValues => ({
      ...prevValues,
      title: info.event.title,
      startDate: info.event.startStr,
      endDate: info.event.endStr,
      description: info.event.extendedProps.description,
      bgColor: info.event.backgroundColor,
    }));
    setObjectId(info.event.extendedProps.id);
    setIsChange(true);
    setModalOpen(true);
  }


  const handleCalendarDrop = async (info: any) => {
    const dropData = {
      _id: info.event.extendedProps.id,
      start: info.event.startStr,
      end: info.event.endStr
    };
    const res = await fetch('/api/calendar/dropEvent', {
      method: 'PUT',
      body: JSON.stringify(dropData),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const resData = await res.json();
    if (resData.message === "Success") {
      getSchedules();
    }
  }

  const getSchedules = async () => {
    const res = await fetch('/api/calendar/getSchedule', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const resData = await res.json();
    if (resData.message === "Success") {
      setEvents(resData.newSchedule);
    }
  }
  useEffect(() => {
    getSchedules();
  }, []);


  async function saveCalendarEvent() {
    const res = await fetch('/api/calendar/saveCalendar', {
      method: 'POST',
      body: JSON.stringify(initValues),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const resData = await res.json();
    if (resData.message === "Success") {
      getSchedules();
      setModalOpen(false);
      setInitValues({
        title: '',
        startDate: '',
        endDate: '',
        bgColor: 'rgb(124, 179, 66)',
        description: '',
      });
    }
  }

  const updateEvent = async () => {
    const data = {
      _id: objectId,
      initValues
    }
    const res = await fetch('/api/calendar/updateEvent', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const resData = await res.json();
    if (resData.message === "Success") {
      getSchedules();
      setModalOpen(false);
      setInitValues({
        title: '',
        startDate: '',
        endDate: '',
        bgColor: 'rgb(124, 179, 66)',
        description: '',
      });
    }
  }

  const handleEventResize = async (info: any) => {
    const resizeData = {
      _id: info.event.extendedProps.id,
      start: info.event.startStr,
      end: info.event.endStr
    };
    const res = await fetch('/api/calendar/dropEvent', {
      method: 'PUT',
      body: JSON.stringify(resizeData),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const resData = await res.json();
    if (resData.message === "Success") {
      getSchedules();
    }
  }

  const handleEventDelete = async () => {
    const res = await fetch('/api/calendar/deleteEvent', {
      method: 'POST',
      body: JSON.stringify({ _id: objectId }),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const resData = await res.json();
    if (resData.message === "Success") {
      getSchedules();
      setModalOpen(false);
      setInitValues({
        title: '',
        startDate: '',
        endDate: '',
        bgColor: 'rgb(124, 179, 66)',
        description: '',
      });
    }
  }

  const handleSubmit = () => {
    if (initValues.title !== "" && initValues.startDate !== "" && initValues.endDate !== "") {
      if (!isChange) {
        saveCalendarEvent();
      } else {
        updateEvent();
      }
    }
  }

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInitValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
  }


  return (
    <FullLayout title={languagejson[lang].myEvents}>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            p: 2,
            width: '100vw',
            background: '#3339',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <FullCalendar
            nowIndicator={true}
            eventClick={handleEventSelect}
            editable={true}
            views={{
              dayGrid: {
                selectable: true,
              },
              timeGrid: {
                selectable: true,
              },
              dayGridMonth: {
                selectable: false,
              },
            }}
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
            initialView="timeGridWeek"
            eventDrop={handleCalendarDrop}
            eventResize={handleEventResize}
            select={handleCalendarSelect}
            events={events}
            locale={"en-gb"}
            timeZone={"EST"}
            titleFormat={{ year: "numeric", month: "numeric", day: "numeric" }}
            allDaySlot={false}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
              list: "List",
            }}
            headerToolbar={{
              left: "dayGridMonth,timeGridWeek,timeGridDay",
              center: "title",
              right: "today prevYear,prev,next,nextYear",
            }}
          />

        </Box>
      </Box>
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={modalOpen}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            color: 'whitesmoke'
          }}
          id="customized-dialog-title"
        >
          {!isChange ? "Save Event" : "Setting Event"}
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Box
            sx={{
              '& .MuiTextField-root': { m: 1 },
            }}
            component='form'
            noValidate
            autoComplete='false'
          >
            <TextField
              fullWidth
              label='Title'
              name='title'
              onChange={handleTextFieldChange}
              value={initValues.title}
            />
            <TextField
              fullWidth
              label='Start Time'
              name='startDate'
              type='datetime'
              onChange={handleTextFieldChange}
              value={initValues.startDate}
            />
            <TextField
              fullWidth
              label='End Time'
              name='endDate'
              type='datetime'
              onChange={handleTextFieldChange}
              value={initValues.endDate}
            />
            <TextField
              select
              fullWidth
              label='bgColor'
              name="bgColor"
              helperText='Please select bgColor'
              onChange={handleTextFieldChange}
              value={initValues.bgColor}
            >
              {bgColorLists.map((bgColorList) =>
                <MenuItem value={bgColorList.value}>
                  <span style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: bgColorList.value,
                    marginRight: "10px"
                  }} />
                  <span>{bgColorList.label}</span>
                </MenuItem>
              )}
            </TextField>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              name='description'
              onChange={handleTextFieldChange}
              value={initValues.description}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {
            !isChange ? (
              <></>
            ) : (
              <Button sx={{ backgroundColor: 'red' }} onClick={handleEventDelete}>Delete</Button>
            )
          }
          <Button type={'submit'} onClick={handleSubmit}>
            Save changes
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </FullLayout>
  )
}

export async function getServerSideProps({ req }: { req: NextApiRequest }) {
  const session = await getSession({
    req,
  })

  if (!session) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      session,
    },
  }
}
