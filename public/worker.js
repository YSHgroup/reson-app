self.addEventListener('message', (event) => {
    if (event.data === 'start') {
        setInterval(() => {
            let currentDate = new Date();
            let currentDatePlusFiveMinutes = new Date(currentDate.getTime() + 5 * 60000);
            fetch('/api/calendar/checkScheduleWithinNextFiveMinutes', {
                method: 'POST',
                body: JSON.stringify({
                    currentDate: currentDate.toISOString(),
                    plusFiveMinutes: currentDatePlusFiveMinutes.toISOString()
                }),
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(response => response.json())
                .then(data => {
                    // Do something with the response data
                    // console.log(data);
                })
                .catch(error => {
                    // Handle any errors
                    // console.error(error);
                });
        }, 60000); // 60 seconds = 1 minute
    }
});