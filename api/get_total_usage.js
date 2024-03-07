// Function to fetch total usage data from the server
async function fetchTotalUsage() {
  try {
    const response = await fetch("http://localhost:3000/total_usage");
    const data = await response.json();

    // Update the paragraph element with the total usage data
    document.getElementById(
      "totalUsage"
    ).textContent = `Total usage: ${data.hours} hours, ${data.minutes} minutes, ${data.seconds} seconds`;
  } catch (error) {
    console.error("Error fetching total usage:", error);
    document.getElementById("totalUsage").textContent =
      "Failed to fetch total usage";
  }
}

// Fetch total usage data initially and then set up polling
fetchTotalUsage();

// Set up polling to fetch total usage data every second
setInterval(fetchTotalUsage, 1000);
