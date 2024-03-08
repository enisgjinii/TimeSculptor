let selectedDate = new Date(); // Variable to store the selected date

// Function to fetch total usage data from the server for a specific date
async function fetchTotalUsage(date) {
  try {
    const response = await fetch(
      `http://localhost:3000/total_usage?date=${date}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch total usage data. Server responded with status ${response.status}`
      );
    }

    const data = await response.json();

    if (
      data &&
      data.hours !== undefined &&
      data.minutes !== undefined &&
      data.seconds !== undefined
    ) {
      // Update the paragraph element with the total usage data
      const totalUsageElement = document.getElementById("totalUsage");
      if (totalUsageElement) {
        totalUsageElement.textContent = `Date: ${date}, Total usage: ${data.hours} hours, ${data.minutes} minutes, ${data.seconds} seconds`;
      } else {
        throw new Error("Element with id 'totalUsage' not found");
      }
    } else {
      throw new Error("Invalid data format returned from the server");
    }
  } catch (error) {
    console.error("Error fetching total usage:", error.message);
    document.getElementById("totalUsage").textContent =
      "Failed to fetch total usage";
  }
}

// Function to navigate to the previous day
document.getElementById("back-button").addEventListener("click", () => {
  // Subtract one day
  selectedDate.setDate(selectedDate.getDate() - 1);

  // Check if the selected date is not in the future
  const today = new Date();
  if (selectedDate <= today) {
    document.getElementById("next-button").disabled = false; // Re-enable next button
  }

  // Check if there are -2 or -3 days available
  if (selectedDate.getDate() > 2) {
    document.getElementById("back-button").disabled = false;
  } else {
    document.getElementById("back-button").disabled = true;
  }

  const formattedDate = formatDate(selectedDate);
  fetchTotalUsage(formattedDate);
});

// Function to navigate to today
document.getElementById("today-button").addEventListener("click", () => {
  selectedDate = new Date(); // Reset selected date to today
  document.getElementById("back-button").disabled = false; // Enable back button
  document.getElementById("next-button").disabled = true; // Disable next button
  const formattedDate = formatDate(selectedDate);
  fetchTotalUsage(formattedDate);
});

// Function to navigate to the next day
document.getElementById("next-button").addEventListener("click", () => {
  // Add one day
  selectedDate.setDate(selectedDate.getDate() + 1);

  // Check if the selected date is not in the future
  const today = new Date();
  if (selectedDate >= today) {
    document.getElementById("next-button").disabled = true; // Disable next button
  }

  // Re-enable back button
  document.getElementById("back-button").disabled = false;

  const formattedDate = formatDate(selectedDate);
  fetchTotalUsage(formattedDate);
});

// Function to format date as MM/DD/YYYY
function formatDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Fetch total usage data initially for today's date
const formattedDate = formatDate(selectedDate);
fetchTotalUsage(formattedDate);

// Set up polling to fetch total usage data every second
setInterval(() => {
  const formattedDate = formatDate(selectedDate);
  fetchTotalUsage(formattedDate);
}, 1000);
