// Initialize currentDateForCategories
let currentDateForCategories = new Date();
// Function to fetch data from the endpoint
function fetchCategoryData(startDate, endDate) {
  // Fetch data from the endpoint
  fetch(`http://localhost:3000/category_usage_by_date/${startDate}/${endDate}`)
    .then((response) => response.json())
    .then((data) => {
      // Access the <ul> element
      const ulElement = document.getElementById("mostUsedCategories");
      // Clear any existing content in the <ul> element
      ulElement.innerHTML = "";
      // Iterate over the data and populate the <ul> element
      for (const category in data) {
        const { hours, minutes, seconds } = data[category];
        // Create a new <li> element for each category
        const liElement = document.createElement("li");
        // Apply Tailwind CSS classes to the <li> element
        liElement.className =
          "flex justify-between border-b border-gray-400 py-2"; // Flex container with space between items and border
        // Set the text content of the <li> element
        liElement.innerHTML = `<span class="text-right text-gray-500">${category}</span><span class="text-gray-500">${hours} hours, ${minutes} minutes</span>`;
        // Append the <li> element to the <ul> element
        ulElement.appendChild(liElement);
      }
    })
    .catch((error) => {
      console.error("Error fetching category usage data:", error);
    });
}
// Initialize flatpickr date picker for start and end dates
flatpickr("#startDate", {
  dateFormat: "Y-m-d",
  onChange: function (selectedDates, dateStr) {
    const startDate = dateStr;
    const endDate = document.getElementById("endDate").value;
    fetchCategoryData(startDate, endDate);
  },
});
flatpickr("#endDate", {
  dateFormat: "Y-m-d",
  onChange: function (selectedDates, dateStr) {
    const endDate = dateStr;
    const startDate = document.getElementById("startDate").value;
    fetchCategoryData(startDate, endDate);
  },
});
// Initialize fetch data with today's date
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");
const startDate = `${year}-${month}-${day}`;
const endDate = `${year}-${month}-${day}`;
fetchCategoryData(startDate, endDate);
// Event listeners
document.getElementById("back-button").addEventListener("click", () => {
  currentDateForCategories.setDate(currentDateForCategories.getDate() - 1);
  const startDate = formatDateForCategory(currentDateForCategories);
  const endDate = formatDateForCategory(
    new Date(currentDateForCategories.getTime())
  ); // Create a copy of the date object
  fetchCategoryData(startDate, endDate);
  // Clear the start date and end date inputs
  document.getElementById("startDate")._flatpickr.clear();
  document.getElementById("endDate")._flatpickr.clear();
});
document.getElementById("today-button").addEventListener("click", () => {
  currentDateForCategories = new Date();
  const startDate = formatDateForCategory(currentDateForCategories);
  const endDate = formatDateForCategory(
    new Date(currentDateForCategories.getTime())
  ); // Create a copy of the date object
  fetchCategoryData(startDate, endDate);
  // Clear the start date and end date inputs
  document.getElementById("startDate")._flatpickr.clear();
  document.getElementById("endDate")._flatpickr.clear();
});
document.getElementById("next-button").addEventListener("click", () => {
  currentDateForCategories.setDate(currentDateForCategories.getDate() + 1);
  const startDate = formatDateForCategory(currentDateForCategories);
  const endDate = formatDateForCategory(
    new Date(currentDateForCategories.getTime())
  ); // Create a copy of the date object
  fetchCategoryData(startDate, endDate);
  // Clear the start date and end date inputs
  document.getElementById("startDate")._flatpickr.clear();
  document.getElementById("endDate")._flatpickr.clear();
});
// Function to format date in "YYYY-MM-DD" format
function formatDateForCategory(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
