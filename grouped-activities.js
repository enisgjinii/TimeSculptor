window.onload = () => {
    fetchAndRenderActivities();
    setInterval(() => {
        if (!window.fetchInProgress) {
            fetchAndRenderActivities();
        }
    }, 60000); // Refresh every minute (60,000 milliseconds)
};
let fetchInProgress = false;
async function fetchAndRenderActivities() {
    if (fetchInProgress) return;
    fetchInProgress = true;
    try {
        const response = await fetch('http://localhost:3000/grouped-activities');
        if (!response.ok) {
            throw new Error(`Unable to fetch grouped activities. Status: ${response.status}`);
        }
        const groupedActivities = await response.json();
        console.log('Grouped Activities:', groupedActivities); // Log the fetched data
        if (!Array.isArray(groupedActivities)) {
            throw new Error('Response is not a valid list of grouped activities.');
        }
        renderActivities(groupedActivities);
    } catch (error) {
        console.error('Error fetching grouped activities:', error.message);
        renderErrorMessage('Unable to load grouped activities. Please try again later.');
    } finally {
        fetchInProgress = false;
    }
}
function renderActivities(activities) {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        renderErrorMessage('Calendar element not found.');
        return;
    }
    const filteredActivities = activities.filter(group => {
        const startTime = new Date(group.start).getTime();
        const endTime = new Date(group.end).getTime();
        const duration = endTime - startTime;
        return duration > 60000; // Only include activities longer than 1 minute
    });
    const events = filteredActivities.map(group => {
        return {
            title: `${group.ownerName}`,
            start: new Date(group.start), // Ensure unique start times
            end: new Date(group.end), // Ensure unique end times
            backgroundColor: getEventColor(group.ownerName),
            extendedProps: {
                owner: group.ownerName,
                category: group.category || 'default'
            }
        };
    });
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridDay',
        allDaySlot: false,
        slotDuration: '00:30:00',
        slotLabelInterval: '03:00',
        height: 650,
        slotLabelFormat: {
            hour: 'numeric',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: 'short'
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,agendaWeek,toggleEventsButton'
        },
        selectable: true,
        editable: true,
        droppable: true,
        eventResizableFromStart: true,
        eventOverlap: false,
        eventSources: [
            { events: events, color: 'blue', textColor: 'white' }
        ],
        eventClick: function (info) {
            showEventDetails(info.event);
        },
        eventDidMount: function (info) {
            info.el.classList.add('custom-event');
            addIconToEvent(info.el, info.event.extendedProps.owner);
        },
        select: function (info) {
            const title = prompt('Enter Event Title:');
            if (title) {
                calendar.addEvent({
                    title: title,
                    start: info.start,
                    end: info.end,
                    allDay: info.allDay
                });
            }
            calendar.unselect();
        },
        eventReceive: function (event) {
            alert('Event Dropped: ' + event.event.title);
        },
        eventDrop: function (info) {
            alert('Event moved to: ' + info.event.start.toLocaleString());
        },
        eventResize: function (info) {
            alert('Event resized to: ' + info.event.end.toLocaleString());
        },
        customButtons: {
            toggleEventsButton: {
                text: 'Toggle Events',
                click: function () {
                    toggleEventVisibility(calendar);
                }
            }
        },
        eventMouseEnter: function (info) {
            const tooltip = new Tooltip(info.el, {
                title: info.event.title,
                placement: 'top',
                trigger: 'hover',
                container: 'body'
            });
        },
        views: {
            agendaWeek: {
                type: 'listWeek',
                duration: { weeks: 1 },
                buttonText: 'Agenda'
            }
        },
        eventLimit: true,
        eventsSet: function (events) {
            console.log('Current events:', events);
        }
    });
    calendar.setOption('height', 700);
    calendar.setOption('contentHeight', 650);
    calendar.render();
}
function renderErrorMessage(message) {
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('error-message');
    errorMessage.textContent = message;
    document.body.appendChild(errorMessage);
}
function showEventDetails(event) {
    const eventDetails = {
        'Title': event.title,
        'Start Time': event.start.toLocaleString(),
        'End Time': event.end.toLocaleString()
    };
    let detailsString = '';
    for (const key in eventDetails) {
        detailsString += `${key}: ${eventDetails[key]}\n`;
    }
    alert(detailsString);
}
function toggleEventVisibility(calendar) {
    const events = calendar.getEvents();
    events.forEach(event => {
        if (event.isVisible) {
            event.remove();
        } else {
            calendar.addEvent(event);
        }
    });
}
function getEventColor(ownerName) {
    switch (ownerName) {
        case 'MongoDBCompass':
            return '#FFD700'; // Yellow for MongoDBCompass
        case 'Electron':
            return '#00CED1'; // Cyan for
            Electron
        case 'Visual Studio Code':
            return '#9370DB'; // Indigo for Visual Studio Code
        default:
            return '#808080'; // Gray for other apps
    }
}
function addIconToEvent(eventElement, ownerName) {
    const icon = document.createElement('i');
    icon.classList.add('app-icon');
    switch (ownerName) {
        case 'MongoDBCompass':
            icon.classList.add('fab', 'fa-compass'); // Icon for MongoDBCompass
            break;
        case 'Electron':
            icon.classList.add('fab', 'fa-electron'); // Icon for Electron
            break;
        case 'Visual Studio Code':
            icon.classList.add('fas', 'fa-code'); // Icon for Visual Studio Code
            break;
        default:
            icon.classList.add('fas', 'fa-question'); // Icon for other apps
            break;
    }
    eventElement.prepend(icon);
}