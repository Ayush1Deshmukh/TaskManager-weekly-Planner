// Define an array to store events
let events = [];

// Variables to store event input fields and reminder list
let eventDateInput = document.getElementById("eventDate");
let eventTimeInput = document.getElementById("eventTime");
let eventTitleInput = document.getElementById("eventTitle");
let eventDescriptionInput = document.getElementById("eventDescription");
let reminderList = document.getElementById("reminderList");

// Counter to generate unique event IDs
let eventIdCounter = 1;

// Load events from LocalStorage on page load
window.onload = function() {
    loadEvents();
};

// Function to enable notifications
function enableNotifications() {
    if (Notification.permission === "default") {
        Notification.requestPermission().then(function(permission) {
            if (permission === "granted") {
                alert("Notifications enabled for your tasks!");
            } else {
                alert("Notifications denied. Please allow notifications for reminders.");
            }
        });
    } else if (Notification.permission === "granted") {
        alert("Notifications are already enabled.");
    } else {
        alert("Notifications are blocked. Please allow notifications for reminders.");
    }
}

// Function to show notification
function showNotification(event) {
    if (Notification.permission === "granted") {
        let eventDate = new Date(event.date + 'T' + event.time);
        let notificationTime = eventDate - Date.now();

        if (notificationTime > 0) {
            setTimeout(() => {
                new Notification(event.title, {
                    body: `${event.description} on ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                });
            }, notificationTime);
        }
    }
}

// Function to add events
function addEvent() {
    let date = eventDateInput.value;
    let time = eventTimeInput.value;
    let title = eventTitleInput.value;
    let description = eventDescriptionInput.value;

    if (date && title) {
        // Create a unique event ID
        let eventId = eventIdCounter++;

        let event = {
            id: eventId,
            date: date,
            time: time,
            title: title,
            description: description
        };

        events.push(event);

        saveEvents();
        showCalendar(currentMonth, currentYear);
        eventDateInput.value = "";
        eventTimeInput.value = "";
        eventTitleInput.value = "";
        eventDescriptionInput.value = "";
        displayReminders();
        showNotification(event);
    }
}

// Function to delete an event by ID
function deleteEvent(eventId) {
    let eventIndex = events.findIndex(event => event.id === eventId);

    if (eventIndex !== -1) {
        events.splice(eventIndex, 1);
        saveEvents();
        showCalendar(currentMonth, currentYear);
        displayReminders();
    }
}

// Function to display reminders
function displayReminders() {
    reminderList.innerHTML = "";
    for (let i = 0; i < events.length; i++) {
        let event = events[i];
        let eventDate = new Date(event.date + 'T' + event.time);
        if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
            let listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${event.title}</strong> - ${event.description} on ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            let deleteButton = document.createElement("button");
            deleteButton.className = "delete-event";
            deleteButton.textContent = "Delete";
            deleteButton.onclick = function () {
                deleteEvent(event.id);
            };

            listItem.appendChild(deleteButton);
            reminderList.appendChild(listItem);
        }
    }
}

// Function to generate a range of years for the year select input
function generate_year_range(start, end) {
    let years = "";
    for (let year = start; year <= end; year++) {
        years += "<option value='" + year + "'>" + year + "</option>";
    }
    return years;
}

// Initialize date-related variables
let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let selectYear = document.getElementById("year");
let selectMonth = document.getElementById("month");

let createYear = generate_year_range(1970, 2050);
document.getElementById("year").innerHTML = createYear;

let calendar = document.getElementById("calendar");

let months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Create the table header for the days of the week
let dataHead = "<tr>";
for (let dhead in days) {
    dataHead += "<th data-days='" + days[dhead] + "'>" + days[dhead] + "</th>";
}
dataHead += "</tr>";

document.getElementById("thead-month").innerHTML = dataHead;

let monthAndYear = document.getElementById("monthAndYear");
showCalendar(currentMonth, currentYear);

// Function to navigate to the next month
function next() {
    currentYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    currentMonth = (currentMonth + 1) % 12;
    showCalendar(currentMonth, currentYear);
}

// Function to navigate to the previous month
function previous() {
    currentYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    currentMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    showCalendar(currentMonth, currentYear);
}

// Function to jump to a specific month and year
function jump() {
    currentYear = parseInt(selectYear.value);
    currentMonth = parseInt(selectMonth.value);
    showCalendar(currentMonth, currentYear);
}

// Function to display the calendar
// Function to display the calendar
function showCalendar(month, year) {
    let firstDay = new Date(year, month, 1).getDay();
    let tbl = document.getElementById("calendar-body");
    tbl.innerHTML = "";
    monthAndYear.innerHTML = months[month] + " " + year;
    selectYear.value = year;
    selectMonth.value = month;

    let date = 1;
    for (let i = 0; i < 6; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                let cell = document.createElement("td");
                let cellText = document.createTextNode("");
                cell.appendChild(cellText);
                row.appendChild(cell);
            } else if (date > daysInMonth(month, year)) {
                break;
            } else {
                let cell = document.createElement("td");
                cell.setAttribute("data-date", date);
                cell.setAttribute("data-month", month + 1);
                cell.setAttribute("data-year", year);
                cell.setAttribute("data-month_name", months[month]);
                cell.className = "date-picker";
                cell.innerHTML = "<span>" + date + "</span>";

                if (date === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
                    cell.className = "date-picker selected";
                }

                // Check if there are events on this date
                if (hasEventOnDate(date, month, year)) {
                    cell.classList.add("event-marker");
                    cell.appendChild(createEventTooltip(date, month, year));
                }

                row.appendChild(cell);
                date++;
            }
        }
        tbl.appendChild(row);
    }

    displayReminders();
}

// Function to create an event tooltip
function createEventTooltip(date, month, year) {
    let tooltip = document.createElement("div");
    tooltip.className = "event-tooltip";
    let eventsOnDate = getEventsOnDate(date, month, year);
    for (let i = 0; i < eventsOnDate.length; i++) {
        let event = eventsOnDate[i];
        let eventDate = new Date(event.date + 'T' + event.time);
        let eventText = `<strong>${event.title}</strong> - ${event.description} on ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        let eventElement = document.createElement("p");
        eventElement.innerHTML = eventText;
        tooltip.appendChild(eventElement);
    }
    return tooltip;
}

// Function to get events on a specific date
function getEventsOnDate(date, month, year) {
    return events.filter(function(event) {
        let eventDate = new Date(event.date + 'T' + event.time);
        return (
            eventDate.getDate() === date &&
            eventDate.getMonth() === month &&
            eventDate.getFullYear() === year
        );
    });
}

// Function to check if there are events on a specific date
function hasEventOnDate(date, month, year) {
    return getEventsOnDate(date, month, year).length > 0;
}

// Function to get the number of days in a month
function daysInMonth(iMonth, iYear) {
    return 32 - new Date(iYear, iMonth, 32).getDate();
}

// Function to save events to LocalStorage
function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}

// Function to load events from LocalStorage
function loadEvents() {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
        events = JSON.parse(savedEvents);
        displayReminders();
        showCalendar(currentMonth, currentYear);
        // Schedule notifications for all loaded events
        events.forEach(showNotification);
    }
}

// Call the showCalendar function initially to display the calendar
showCalendar(currentMonth, currentYear);
