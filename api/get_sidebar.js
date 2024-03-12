function updateSidebar() {
  const mostTimeSpentApp = document.getElementById("most-time-spent-app");
  const allAppsContainer = document.getElementById("all-apps-container");
  // Make a request to the server to fetch the most used app
  fetch("http://localhost:3000/most_used_app")
    .then((response) => response.json())
    .then((data) => {
      // Check if data contains the most used app and its total usage
      if (data.application && data.totalUsage) {
        // Extract hours, minutes, and seconds from the totalUsage object
        const { hours, minutes, seconds } = data.totalUsage;
        // Format the total usage time as a string
        const totalUsageString = `${hours} orë, ${minutes} minuta, ${seconds} sekonda`;
        // Format the text content to display both the application and total usage
        mostTimeSpentApp.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Most Used App</h3>
        <div class="mt-4">
          <p class="text-sm font-normal text-gray-600 dark:text-white">Aplikacioni: ${data.application}</p>
          <p class="text-sm font-normal text-gray-600 dark:text-white">Përdorimi Total: ${totalUsageString}</p>
        </div>
      `;
      } else {
        // If data is incomplete or missing, display an error message
        mostTimeSpentApp.textContent =
          "Gabim: Të dhënat janë të paimplementuara për aplikacionin më të përdorur";
      }
    })
    .catch((error) => {
      console.error("Gabim në marrjen e aplikacionit më të përdorur:", error);
      mostTimeSpentApp.textContent =
        "Gabim në marrjen e të dhënave për aplikacionin më të përdorur";
    });
}
