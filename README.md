# Calar

## Description
Calar is a desktop application that tracks and displays an active window timeline. It logs the time spent on various applications and visualizes the data in a color-coded timeline format.

## Files Overview
- **index.html**: This file contains the HTML structure and styling for the user interface of the application. It includes elements for displaying the active window timeline and searching for specific applications. The timeline segments are colored based on the application name.
- **main.js**: This JavaScript file is responsible for managing the Electron main process of the application. It handles window creation, data processing, CSV file operations, and communication with the renderer process. It uses the active-win package to fetch information about the active window.
- **package.json**: The package.json file contains the project metadata and dependencies. It specifies the project name, version, main file, scripts for running the application, dependencies such as Electron and active-win, and other configuration details.

## Setup Instructions
1. Clone the repository.
2. Run `npm install` to install the necessary dependencies.
3. Start the application with `npm start`.

## Usage
- Upon launching the application, the main window will display the active window timeline.
- The application continuously tracks the active window and updates the timeline every second.
- Users can search for specific applications using the search input field to filter the timeline segments.
- The timeline segments are color-coded based on the application name for easy identification.

## Getting Started
1. Clone the Calar repository to your local machine.
2. Install the required dependencies by running `npm install`.
3. Start the application using `npm start`.

## Features
- Real-time tracking of active window timeline.
- Color-coded timeline segments for different applications.
- Search functionality to filter timeline data.

## Technologies Used
- Electron
- HTML
- CSS
- JavaScript

## Dependencies
- active-win

## License
ISC License

For any issues or feedback, please contact [author email if available].

Thank you for using Calar! 🕒🖥️
