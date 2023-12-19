import FullLayout from '@layouts/FullLayout/FullLayout'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography, TextField, MenuItem, Grid, Alert, FormHelperText, useMediaQuery } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { NextApiRequest } from 'next'
import { useRouter } from 'next/router'
import languagejson from "../language.json"
import { useAtom } from 'jotai'
import { dateColorJot, language } from "../jotai"
import { getSession, useSession } from 'next-auth/react'

import FullCalendar from "@fullcalendar/react";
import momentPlugin from '@fullcalendar/moment';
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import React, { useRef, useState, useEffect } from "react";
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import Autocomplete from '@mui/material/Autocomplete';
import { Theme } from '@fullcalendar/core/internal'
import { GenNumForDate } from 'classes/GenNumForDate'
import { dateColor } from '@constants/Status'
import { useTheme } from '@mui/material/styles'

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
interface initValues {
  title: string;
  startDate: Dayjs;
  endDate: Dayjs;
  bgColor?: string;
  description: string;
  from: string;
  to: string;
}
interface Option {
  email: string;
}
export default function Calendar({currentColor}) {
  const router = useRouter();
  const [lang, setLanguage] = useAtom(language)
  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState({});
  const [users, setUsers] = useState<Option[]>([]);
  const [initValues, setInitValues] = useState<initValues>({
    title: '',
    startDate: dayjs(),
    endDate: dayjs(),
    bgColor: 'rgb(124, 179, 66)',
    description: '',
    from: '',
    to: '',
  });
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const [isChange, setIsChange] = useState(false);
  const [objectId, setObjectId] = useState('');
  const calendarRef = useRef(null);
  const { data: session } = useSession()


  const handleClickOpen = () => {
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
  };

  const getUserinfo = async () => {
    const response = await fetch('/api/user/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    let userData = await response.json();
    const users_options: Option[] = [];
    userData.data.map((user: any) => {
      users_options.push({
        email: user.email
      })
    })
    setUsers(users_options);
  }

  const handleCalendarSelect = (info: any) => {
    setInitValues(prevValues => ({
      ...prevValues,
      title: "Tittle",
      startDate: dayjs(info.startStr),
      endDate: dayjs(info.endStr)
    }));
    setSelectedOption(null);
    setObjectId('');
    setIsChange(false);
    setModalOpen(true);
  }

  const handleEventSelect = (info: any) => {
    setSelectedOption(
      info.event.extendedProps.from === session?.user?.email ? { email: info.event.extendedProps.to } : { email: info.event.extendedProps.from }
    )
    setInitValues(prevValues => ({
      ...prevValues,
      title: info.event.title,
      startDate: dayjs(info.event.startStr),
      endDate: dayjs(info.event.endStr),
      description: info.event.extendedProps.description,
      bgColor: info.event.backgroundColor,
      from: info.event.extendedProps.from,
      to: info.event.extendedProps.to
    }));
    setObjectId(info.event.extendedProps.id);
    setIsChange(true);
    setModalOpen(true);
  }


  const handleCalendarDrop = async (info: any) => {
    const dropData = {
      _id: info.event.extendedProps.id,
      start: dayjs(info.event.startStr),
      end: dayjs(info.event.endStr)
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
    getUserinfo();
    getSchedules();
  }, []);


  async function saveCalendarEvent() {
    if(selectedOption?.email === null) {
      return;
    }
    const formdata = {
      title: initValues.title,
      startDate: initValues.startDate,
      endDate: initValues.endDate,
      bgColor: initValues.bgColor,
      description: initValues.description,
      user: selectedOption?.email
    }

    const res = await fetch('/api/calendar/saveCalendar', {
      method: 'POST',
      body: JSON.stringify(formdata),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const resData = await res.json();
    if (resData.message === "Success") {
      getSchedules();
      setModalOpen(false);
      setSelectedOption(null);
      setInitValues({
        title: '',
        startDate: dayjs(),
        endDate: dayjs(),
        bgColor: 'rgb(124, 179, 66)',
        description: '',
        from: '',
        to: '',
      });
    }
  }

  const updateEvent = async () => {
    const updateData = {
      _id: objectId,
      title: initValues.title,
      startDate: initValues.startDate,
      endDate: initValues.endDate,
      bgColor: initValues.bgColor,
      description: initValues.description,
      user: selectedOption?.email
    }
    const res = await fetch('/api/calendar/updateEvent', {
      method: 'PUT',
      body: JSON.stringify(updateData),
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
        startDate: dayjs(),
        endDate: dayjs(),
        bgColor: 'rgb(124, 179, 66)',
        description: '',
        from: '',
        to: '',
      });
    }
  }

  const handleEventResize = async (info: any) => {
    const resizeData = {
      _id: info.event.extendedProps.id,
      start: dayjs(info.event.startStr),
      end: dayjs(info.event.endStr)
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
        startDate: dayjs(),
        endDate: dayjs(),
        bgColor: 'rgb(124, 179, 66)',
        description: '',
        from: '',
        to: '',
      });
    }
  }

  const handleSubmit = () => {
    if (initValues.title !== "") {
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

  const handleOptionChange = (event: any, newValue: Option | null) => {
    setSelectedOption(newValue);
  };

  const getTitleFromOption = (option: Option): string => {
    return option.email.toString();
  };

  const redirectToCallPage = (e: any) => {
    let link = e.target.getAttribute('data-email');
    router.push(`/chat?email=${link}`);
  };

const BorderStyle = styled('div')(({theme}) => ({
  '& a,& table,& tr,& th,& td': {
    borderColor: `${theme.palette.text.primary} !important`
  }
}))
const theme = useTheme();
const brekpointMatch = useMediaQuery(theme.breakpoints.down('sm'))
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
            width: '100%',
            background: (theme) => `${theme.palette.background.default}55`,
            alignItems: 'center',
            textAlign: 'center',
            
            '& a': {
              fontSize: brekpointMatch? '12px !important': 'inherit'
            }
          }}
        >
          <BorderStyle className='divdiv'>

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
            plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, momentPlugin]}
            initialView="timeGridWeek"
            dayHeaders
            dayHeaderDidMount={(args)=> {
              if(args.isToday){
                args.el.style.backgroundColor = `${currentColor}66`;
              }
              args.el.style.color = 'primary.main';
            }}
            viewClassNames={'day-header'}
            eventDrop={handleCalendarDrop}
            eventResize={handleEventResize}
            select={handleCalendarSelect}
            events={events}
            locale={"en-gb"}
            timeZone={"local"}
            titleFormat='MM/DD/YYYY'
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
          </BorderStyle>

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
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
              <MobileDateTimePicker
                label="Start Time"
                renderInput={(params) => <TextField fullWidth {...params} />}
                value={initValues.startDate}
                onChange={(newValue) => {
                  setInitValues(prevValues => ({
                    ...prevValues,
                    startDate: dayjs(newValue),
                  }));
                }}
              />
              <MobileDateTimePicker
                label="End Time"
                renderInput={(params) => <TextField fullWidth {...params} />}
                value={initValues.endDate}
                onChange={(newValue) => {
                  setInitValues(prevValues => ({
                    ...prevValues,
                    endDate: dayjs(newValue),
                  }));
                }}
                minDateTime={initValues.startDate}
              />
            </LocalizationProvider>
            <Autocomplete
              disablePortal
              id="combo-box-demo"
              options={users}
              sx={{ width: '100%' }}
              getOptionLabel={getTitleFromOption}
              value={selectedOption}
              onChange={handleOptionChange}
              disabled={isChange ? true : false}
              renderInput={(params) => <TextField {...params} label="Guests" />}
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
                <MenuItem value={bgColorList.value} key={bgColorList.label}>
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
            isChange && (
              <>
                <Button
                 variant="contained"
                  onClick={redirectToCallPage}
                  data-email={session?.user?.email === initValues.from ? initValues.to : initValues.from}
                  color="success"
                >
                  Join Call
                </Button>
                <Button
                 variant="contained"
                  onClick={handleEventDelete}
                  color="error"
                >
                  Delete
                </Button>
              </>
            )
          }
          <Button type={'submit'} onClick={handleSubmit} variant="contained">
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

  const numForDate = new GenNumForDate()
  const currentColor = dateColor[Number(numForDate.getNum().substring(0, 2))]
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
      currentColor
    },
  }
}
