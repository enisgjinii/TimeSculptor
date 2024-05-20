window.onload = () => {
    const backButton = document.getElementById('backButton');
    const calendarButton = document.getElementById('calendarButton');
    const nextButton = document.getElementById('nextButton');
    const deleteButton = document.getElementById('deleteButton'); // New delete button

    let backClickCount = 0;

    backButton.addEventListener('click', () => {
        backClickCount++;
        fetchData(-backClickCount);
    });

    nextButton.addEventListener('click', () => {
        if (backClickCount > 0) backClickCount--;
        fetchData(-backClickCount); // Pass the negated value of backClickCount
    });

    let calendarButtonClickedDate = null;
    calendarButton.addEventListener('click', () => {
        backClickCount = 0; // Reset back click count when calendar button is clicked
        fetchData(0);
    });

    async function fetchData(daysOffset) {
        try {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + daysOffset);
            const formattedDate = currentDate.toISOString().split('T')[0];
            const response = await fetch(`http://localhost:3000/activities/${formattedDate}`);
            if (response.ok) {
                const activities = await response.json();
                console.log(`Data for the ${daysOffset === 0 ? 'selected' : daysOffset < 0 ? 'previous' : 'next'} date:`, activities);
                renderActivities(activities);
                if (daysOffset === 0) {
                    calendarButtonClickedDate = new Date();
                    // Ensure toggleNextButton is defined or remove this line if not needed
                    toggleNextButton?.(); // Use optional chaining in case the function is not defined
                }
            } else {
                console.error('Failed to fetch data:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching data:', error.message);
        }
    }

    function updateActiveAppInfo(appName) {
        const appElement = document.getElementById('app-name');
        if (appElement) {
            appElement.textContent = `Active app: ${appName}`;
        }
    }

    async function fetchActivities() {
        try {
            const response = await fetch('http://localhost:3000/activities');
            if (!response.ok) {
                throw new Error('Failed to fetch activities');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching activities:', error.message);
            return [];
        }
    }

    function renderActivities(activities) {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        activityList.innerHTML = '';
        activities.slice(0, 10).forEach(activity => {
            const li = document.createElement('li');
            li.classList.add('mb-4', 'ms-4', 'border-b', 'border-gray-200', 'dark:border-gray-700', 'pb-4');
            const div = document.createElement('div');
            div.classList.add('absolute', 'w-3', 'h-3', 'bg-gray-200', 'rounded-full', 'mt-2', '-start-1.5', 'border', 'border-white', 'dark:border-gray-900', 'dark:bg-gray-700');
            li.appendChild(div);
            const time = document.createElement('time');
            time.classList.add('mb-1', 'text-sm', 'font-normal', 'text-gray-400', 'dark:text-gray-500');
            time.textContent = new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'UTC', second: 'numeric' });
            const date = document.createElement('date');
            date.classList.add('text-lg', 'font-semibold', 'text-gray-900', 'dark:text-white', 'mb-1');
            date.textContent = new Date(activity.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const h3 = document.createElement('h3');
            h3.classList.add('text-lg', 'font-semibold', 'text-gray-900', 'dark:text-white', 'mb-1');
            h3.textContent = activity.title;
            const pOwner = document.createElement('p');
            pOwner.classList.add('mb-1', 'text-base', 'font-normal', 'text-gray-500', 'dark:text-gray-400');
            pOwner.textContent = `Owner: ${activity.owner.name}`;
            const space = document.createElement('span');
            space.textContent = ' ';
            const deleteBtn = document.createElement('button'); // Create delete button
            deleteBtn.textContent = 'Delete'; // Set button text
            deleteBtn.addEventListener('click', async () => { // Add event listener for delete button
                try {
                    const result = await Swal.fire({
                        title: 'Are you sure?',
                        text: 'You will not be able to recover this record!',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, delete it!'
                    });
                    if (result.isConfirmed) {
                        const response = await fetch(`http://localhost:3000/activities/${activity._id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            console.log('Record deleted successfully');
                            // Refresh timeline after deletion
                            refreshTimeline();
                        } else {
                            console.error('Failed to delete record:', response.statusText);
                        }
                    }
                } catch (error) {
                    console.error('Error deleting record:', error.message);
                }
            });
            [time, space, date, h3, pOwner, deleteBtn].forEach(el => li.appendChild(el));
            activityList.appendChild(li);
        });
    }

    async function refreshTimeline() {
        renderActivities(await fetchActivities());
    }

    fetchActivities().then(renderActivities);

    window.electron.onActiveApp((event, appName) => {
        console.log(`Active app: ${appName}`);
        updateActiveAppInfo(appName);
    });

    const refreshButton = document.getElementById('refreshButton');
    refreshButton?.addEventListener('click', () => {
        refreshButton.innerHTML = '<i class="fi fi-rr-loading me-2"></i> Coming up';
        setTimeout(() => {
            refreshButton.innerHTML = '<i class="fi fi-rr-refresh me-2"></i> Refresh Timeline';
        }, 500);
        refreshTimeline();
    });
};
