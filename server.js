const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = "mongodb://localhost:27017/activity_tracker";
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const fs = require("fs"); // Require the fs module at the top of your file
const activitySchema = new mongoose.Schema(
  {
    date: String,
    time: String,
    application: String,
  },
  { collection: "activity" }
); // Specify the collection name here
// Create a Mongoose model based on the schema
const Activity = mongoose.model("Activity", activitySchema);
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {});
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
app.get("/activities", async (req, res) => {
  try {
    // Fetch all activities without limiting for now
    const activities = await Activity.find();
    if (activities.length > 0) {
      res.json(activities); // Sending activities as API response
    } else {
      res.status(404).json({ error: "No activities found" });
    }
  } catch (err) {
    console.error("Error fetching activities:", err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});
// Function to convert seconds to hours, minutes, and seconds
function convertSecondsToHMS(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return { hours, minutes, seconds: remainingSeconds };
}
app.get("/most_used_app", async (req, res) => {
  // Get the current date
  const currentDate = new Date();
  // Format the current date in the same format as stored in the MongoDB collection
  const formattedDate = `${
    currentDate.getMonth() + 1
  }/${currentDate.getDate()}/${currentDate.getFullYear()}`;
  try {
    const mostUsedApp = await Activity.aggregate([
      {
        $match: {
          date: formattedDate,
        },
      },
      {
        $group: {
          _id: "$application",
          totalUsageSeconds: { $sum: 1 },
        },
      },
      { $sort: { totalUsageSeconds: -1 } },
      { $limit: 1 },
    ]);
    if (mostUsedApp.length > 0) {
      // Convert total usage from seconds to hours, minutes, and seconds
      const totalUsage = convertSecondsToHMS(mostUsedApp[0].totalUsageSeconds);
      const result = {
        application: mostUsedApp[0]._id,
        totalUsage,
      };
      res.json(result);
    } else {
      res
        .status(404)
        .json({ error: "No activities found for the current date" });
    }
  } catch (err) {
    console.error("Error fetching most used application:", err);
    res.status(500).json({ error: "Failed to fetch most used application" });
  }
});
app.get("/most_used_app_yesterday", async (req, res) => {
  // Get the current date
  const currentDate = new Date();
  // Subtract one day from the current date
  const yesterdayDate = new Date(currentDate);
  yesterdayDate.setDate(currentDate.getDate() - 1);
  // Format the yesterday's date in the same format as stored in the MongoDB collection
  const formattedDate = `${
    yesterdayDate.getMonth() + 1
  }/${yesterdayDate.getDate()}/${yesterdayDate.getFullYear()}`;
  try {
    const mostUsedApp = await Activity.aggregate([
      {
        $match: {
          date: formattedDate,
        },
      },
      {
        $group: {
          _id: "$application",
          totalUsage: { $sum: 1 },
        },
      },
      { $sort: { totalUsage: -1 } },
      { $limit: 1 },
    ]);
    if (mostUsedApp.length > 0) {
      res.json(mostUsedApp[0]);
    } else {
      res
        .status(404)
        .json({ error: "No activities found for yesterday's date" });
    }
  } catch (err) {
    console.error("Error fetching most used application for yesterday:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch most used application for yesterday" });
  }
});
app.get("/all_applications", async (req, res) => {
  try {
    const allApps = await Activity.aggregate([
      {
        $group: {
          _id: "$application",
          totalUsageSeconds: { $sum: 1 },
        },
      },
      {
        $sort: { totalUsageSeconds: -1 }, // Sort by totalUsageSeconds in descending order
      },
    ]);
    if (allApps.length > 0) {
      // Convert total usage from seconds to hours, minutes, and seconds for each application
      const formattedApps = allApps.map((app) => {
        const { _id, totalUsageSeconds } = app;
        const totalUsage = convertSecondsToHMS(totalUsageSeconds);
        return { _id, totalUsage };
      });
      res.json(formattedApps);
    } else {
      res.status(404).json({ error: "No activities found" });
    }
  } catch (err) {
    console.error("Error fetching all applications:", err);
    res.status(500).json({ error: "Failed to fetch all applications" });
  }
});
app.get("/applications_by_date/:date", async (req, res) => {
  try {
    // Parse the date parameter from the URL
    const requestedDate = req.params.date;
    // Convert the requested date to match the format in MongoDB (M/D/YYYY)
    const [year, month, day] = requestedDate.split("-");
    const mongoDBDateFormat = `${parseInt(month)}/${parseInt(day)}/${year}`;
    // Query MongoDB using the converted date format
    const applicationsByDate = await Activity.aggregate([
      {
        $match: {
          date: mongoDBDateFormat,
        },
      },
      {
        $group: {
          _id: "$application",
          totalUsageSeconds: { $sum: 1 },
        },
      },
      {
        $sort: { totalUsageSeconds: -1 }, // Sort by totalUsageSeconds in descending order
      },
    ]);
    // Define categories
    const categories = {
      "Google Chrome": "Browsing",
      "Mozilla Firefox": "Browsing",
      "Microsoft Edge": "Browsing",
      Safari: "Browsing",
      Opera: "Browsing",
      "Visual Studio Code": "Code",
      "Sublime Text": "Code",
      Atom: "Code",
      "Notepad++": "Code",
      Eclipse: "Code",
      "IntelliJ IDEA": "Code",
      NetBeans: "Code",
      "Microsoft Word": "Documents",
      "Microsoft Excel": "Documents",
      "Microsoft PowerPoint": "Documents",
      "LibreOffice Writer": "Documents",
      "LibreOffice Calc": "Documents",
      "LibreOffice Impress": "Documents",
      "Adobe Photoshop": "Design",
      "Adobe Illustrator": "Design",
      "Adobe XD": "Design",
      Sketch: "Design",
      AutoCAD: "Design",
      Blender: "Design",
      GIMP: "Design",
      Zoom: "Communication",
      Skype: "Communication",
      Slack: "Communication",
      "Microsoft Teams": "Communication",
      "WhatsApp.exe": "Communication",
      Discord: "Communication",
      Signal: "Communication",
      Telegram: "Communication",
      "Google Chat": "Communication",
      Outlook: "Communication",
      Notion: "Productivity",
      "Notion Calendar": "Productivity",
      Todoist: "Productivity",
      "Microsoft Store": "Utility",
      FileZilla: "Utility",
      Postman: "Development",
      "GitHub Desktop": "Development",
      "File Explorer": "Utility",
      "OBS Studio": "Media",
      Spotify: "Media",
      Viber: "Communication",
      TimeSculptor: "Productivity",
      MongoDBCompass: "Development",
      // Add more categories and applications as needed
    };
    // Handle the response
    if (applicationsByDate.length > 0) {
      const formattedApps = applicationsByDate.map((app) => {
        const { _id, totalUsageSeconds } = app;
        const totalUsage = convertSecondsToHMS(totalUsageSeconds);
        // Determine category based on application name
        let category = categories[_id] || "Other";
        return { application: _id, category, totalUsage };
      });
      res.json(formattedApps);
    } else {
      res
        .status(404)
        .json({ error: "No activities found for the specified date" });
    }
  } catch (err) {
    console.error("Error fetching applications by date:", err);
    res.status(500).json({ error: "Failed to fetch applications by date" });
  }
});
app.get("/category_usage_by_date/:startDate/:endDate", async (req, res) => {
  try {
    // Parse the start and end dates from the URL
    const startDate = req.params.startDate;
    const endDate = req.params.endDate;
    // Convert the requested dates to match the format in MongoDB (M/D/YYYY)
    const [startYear, startMonth, startDay] = startDate.split("-");
    const startMongoDBDateFormat = `${parseInt(startMonth)}/${parseInt(
      startDay
    )}/${startYear}`;
    const [endYear, endMonth, endDay] = endDate.split("-");
    const endMongoDBDateFormat = `${parseInt(endMonth)}/${parseInt(
      endDay
    )}/${endYear}`;
    // Query MongoDB using the converted date format
    const applicationsByDateRange = await Activity.aggregate([
      {
        $match: {
          date: { $gte: startMongoDBDateFormat, $lte: endMongoDBDateFormat },
        },
      },
      {
        $group: {
          _id: "$application",
          totalUsageSeconds: { $sum: 1 },
        },
      },
      {
        $sort: { totalUsageSeconds: -1 }, // Sort by totalUsageSeconds in descending order
      },
    ]);
    const categories = {
      "Google Chrome": "Browsing",
      "Mozilla Firefox": "Browsing",
      "Microsoft Edge": "Browsing",
      Safari: "Browsing",
      Opera: "Browsing",
      "Visual Studio Code": "Code",
      "Sublime Text": "Code",
      Atom: "Code",
      "Notepad++": "Code",
      Eclipse: "Code",
      "IntelliJ IDEA": "Code",
      NetBeans: "Code",
      "Microsoft Word": "Documents",
      "Microsoft Excel": "Documents",
      "Microsoft PowerPoint": "Documents",
      "LibreOffice Writer": "Documents",
      "LibreOffice Calc": "Documents",
      "LibreOffice Impress": "Documents",
      "Adobe Photoshop": "Design",
      "Adobe Illustrator": "Design",
      "Adobe XD": "Design",
      Sketch: "Design",
      AutoCAD: "Design",
      Blender: "Design",
      GIMP: "Design",
      Zoom: "Communication",
      Skype: "Communication",
      Slack: "Communication",
      "Microsoft Teams": "Communication",
      "WhatsApp.exe": "Communication",
      Discord: "Communication",
      Signal: "Communication",
      Telegram: "Communication",
      "Google Chat": "Communication",
      Outlook: "Communication",
      Notion: "Productivity",
      "Notion Calendar": "Productivity",
      Todoist: "Productivity",
      "Microsoft Store": "Utility",
      FileZilla: "Utility",
      Postman: "Development",
      "GitHub Desktop": "Development",
      "File Explorer": "Utility",
      "OBS Studio": "Media",
      Spotify: "Media",
      Viber: "Communication",
      TimeSculptor: "Productivity",
      MongoDBCompass: "Development",
      // Add more categories and applications as needed
    };
    // Helper function to format time
    function formatTime(timeInSeconds) {
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      const seconds = timeInSeconds % 60;
      return { hours, minutes, seconds };
    }
    // Handle the response
    if (applicationsByDateRange.length > 0) {
      const categoryUsage = {};
      applicationsByDateRange.forEach((app) => {
        const { _id, totalUsageSeconds } = app;
        // Determine category based on application name
        const category = categories[_id] || "Other";
        // Convert total usage seconds to hours, minutes, and seconds
        const { hours, minutes, seconds } = formatTime(totalUsageSeconds);
        // If the category doesn't exist in the result object, initialize it
        if (!categoryUsage[category]) {
          categoryUsage[category] = { hours, minutes, seconds };
        } else {
          // If the category already exists, accumulate the usage time
          categoryUsage[category].hours += hours;
          categoryUsage[category].minutes += minutes;
          categoryUsage[category].seconds += seconds;
        }
      });
      // Convert accumulated seconds to hours, minutes, and seconds
      for (const category in categoryUsage) {
        const { hours, minutes, seconds } = categoryUsage[category];
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        categoryUsage[category] = formatTime(totalSeconds);
      }
      res.json(categoryUsage);
    } else {
      res
        .status(404)
        .json({ error: "No activities found for the specified date range" });
    }
  } catch (err) {
    console.error("Error fetching category usage by date range:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch category usage by date range" });
  }
});
// Route handler for /total_usage
app.get("/total_usage", async (req, res) => {
  // Get the date query parameter from the request, default to today's date
  const date = req.query.date
    ? req.query.date
    : new Date().toISOString().split("T")[0];
  try {
    const totalUsage = await Activity.aggregate([
      {
        $match: {
          date: date,
        },
      },
      {
        $group: {
          _id: null,
          totalUsageSeconds: { $sum: 1 }, // Sum up the total number of activities
        },
      },
    ]);
    if (totalUsage.length > 0) {
      // Convert total usage from seconds to hours, minutes, and seconds
      const formattedTotalUsage = convertSecondsToHMS(
        totalUsage[0].totalUsageSeconds
      );
      res.json(formattedTotalUsage);
    } else {
      res
        .status(404)
        .json({ error: "No activities found for the provided date" });
    }
  } catch (err) {
    console.error("Error calculating total usage for the provided date:", err);
    res
      .status(500)
      .json({ error: "Failed to calculate total usage for the provided date" });
  }
});
app.post("/send-email", async (req, res) => {
  try {
    console.log("Received request to send email");
    // Create a Date object for today's date
    const today = new Date();
    console.log("Today:", today);
    // Format today's date in the desired format (MM/DD/YYYY)
    const formattedDate = `${
      today.getMonth() + 1
    }/${today.getDate()}/${today.getFullYear()}`;
    console.log("Formatted Date:", formattedDate);
    // Get the today in this format : Friday, October 13
    const day = today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    console.log("Day:", day);
    // Make a request to the /total_usage endpoint to get the total usage data for today
    const totalUsageResponse = await fetch(
      `http://localhost:3000/total_usage?date=${formattedDate}`
    );
    if (!totalUsageResponse.ok) {
      throw new Error(
        `Failed to fetch total usage data. Status: ${totalUsageResponse.status}`
      );
    }
    const totalUsageData = await totalUsageResponse.json();
    // Construct the start date dynamically as the current date
    const startDate = new Date().toISOString().split("T")[0];
    // Set the end date statically
    const endDate = startDate;
    // Make a request to the /category_usage_by_date endpoint to get the category usage data for the specified date range
    const categoryUsageResponse = await fetch(
      `http://localhost:${PORT}/category_usage_by_date/${startDate}/${endDate}`
    );
    if (!categoryUsageResponse.ok) {
      throw new Error(
        `Failed to fetch category usage data. Status: ${categoryUsageResponse.status}`
      );
    }
    const categoryUsageData = await categoryUsageResponse.json();
    console.log("Category Usage Data:", categoryUsageData);
    // Log categories to the console
    console.log("Categories:");
    for (const category in categoryUsageData) {
      console.log(category);
    }
    // Log each category with its usage
    for (const category in categoryUsageData) {
      console.log(`${category}:`, categoryUsageData[category]);
    }
    console.log("Total Usage Data:", totalUsageData);
    console.log(typeof totalUsageData.hours, totalUsageData.hours);
    console.log(typeof totalUsageData.minutes, totalUsageData.minutes);
    console.log(typeof totalUsageData.seconds, totalUsageData.seconds);
    // Ensure that totalUsageData is not undefined and properties exist
    if (
      !totalUsageData ||
      totalUsageData.hours === undefined ||
      totalUsageData.minutes === undefined ||
      totalUsageData.seconds === undefined
    ) {
      throw new Error("Total usage data is not available or is invalid");
    }
    // Create a Nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "egjini17@gmail.com",
        pass: "vckbjkoubamsduur",
      },
    });
    let mailOptions = {
      from: "egjini17@gmail.com",
      to: "egjini17@gmail.com",
      subject: "Chart",
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Summary Report</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: 'Poppins', sans-serif; color: #333; background-color: #f4f4f4; padding: 20px;">
          <table
              style="width: 100%; max-width: 600px; margin: auto; border-collapse: collapse; background-color: #ffffff; padding: 20px;">
              <tr>
                  <td style="padding: 20px; text-align: center;">
                  <img src="cid:logo" width="100" height="100"/>  
                  <p style="font-size: 20px; color: #555;">TimeSculptor</p>                    
                  <h2 style="color: #333;">Daily Summary Report</h2>
                  <p style="font-size: 18px; color: #555;">${day}</p>
              </td>
              </tr>
              <!-- Tracked Time -->
              <tr>
                  <td style="padding: 10px 20px;">
                      <h3>Tracked Time</h3>
                      <p>Total Usage: ${totalUsageData.hours} hours, ${
        totalUsageData.minutes
      } minutes, ${totalUsageData.seconds} seconds</p>
                  </td>
              </tr>
              <!-- Categories -->
<tr>
    <td style="padding: 10px 20px;">
        <h3>Categories</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <!-- Iterate over categoryUsageData and generate table rows -->
            ${Object.entries(categoryUsageData)
              .map(
                ([category, usage]) => `
            <tr>
                <td style="width: 70%; text-align: left; padding-right: 10px;">${category}</td>
                <td style="text-align: right;">${usage.hours} hours, ${usage.minutes} minutes</td>
            </tr>
            `
              )
              .join("")}
        </table>
    </td>
</tr>
              <tr>
                  <td style="padding: 20px; text-align: center;">
                      <p>Did you know that you can share your referral link below to give your friends one free month of Rize?
                      </p>
                      <a href="https://rize.io?utm_source=refer&code=061ADC&name=Enis+Gjini"
                          style="color: #007bff; text-decoration: none;">https://rize.io?utm_source=refer&code=061ADC&name=Enis+Gjini</a>
                      <p>You will also receive one free month of TimeSculptor for each friend that becomes a paid subscriber.
                      </p>
                  </td>
              </tr>
              <!-- Footer -->
              <tr>
                  <td style="padding: 20px; text-align: center; font-size: 14px; color: #999;">
                      <p>Review Your Day</p>
                      <p>Please feel free to email us directly if you have any questions or comments. Any feedback is greatly
                          appreciated.</p>
                      <p>Regards,<br>Enis Gjini<br>Cofounder & CEO</p>
                      <p>This email was sent to you because you signed up for TimeSculptor.</p>
                  </td>
              </tr>
          </table>
      </body>
      </html>`,
      attachments: [
        {
          filename: "logo.png",
          path: "logo.png",
          cid: "logo", //same cid value as in the html img src
        },
      ],
    };
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.status(500).send("Error sending email");
      } else {
        console.log("Email sent successfully:", info);
        res.send("Email sent successfully");
      }
    });
  } catch (error) {
    console.error("Failed to process the request:", error);
    res.status(500).send("Failed to process the request");
  }
});
