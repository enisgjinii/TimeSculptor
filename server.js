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
    console.log("Successfully connected to MongoDB using Mongoose");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
app.get("/activities", async (req, res) => {
  try {
    // Fetch all activities without limiting for now
    const activities = await Activity.find();
    console.log("Fetched activities:", activities);
    if (activities.length > 0) {
      res.json(activities); // Sending activities as API response
    } else {
      console.log("No activities found");
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
      console.log("No activities found for the current date");
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
      console.log("No activities found for yesterday's date");
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
      console.log("No activities found");
      res.status(404).json({ error: "No activities found" });
    }
  } catch (err) {
    console.error("Error fetching all applications:", err);
    res.status(500).json({ error: "Failed to fetch all applications" });
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
      console.log("No activities found for the provided date");
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
    // Create a Date object for today's date
    const today = new Date();
    // Format today's date in the desired format (MM/DD/YYYY)
    const formattedDate = `${
      today.getMonth() + 1
    }/${today.getDate()}/${today.getFullYear()}`;

    // Get the today in this format : Friday, October 13
    const day = today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    // Make a request to the /total_usage endpoint to get the total usage data for today
    const totalUsageResponse = await fetch(
      `http://localhost:3000/total_usage?date=${formattedDate}`
    );
    const totalUsageData = await totalUsageResponse.json();

    // Ensure that totalUsageData is not undefined
    if (
      !totalUsageData ||
      !totalUsageData.hours ||
      !totalUsageData.minutes ||
      !totalUsageData.seconds
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
              <!-- Work Hours -->
              <tr>
                  <td id="workHours" style="padding: 10px 20px;">
                      <h3>Work Hours</h3>
                      <!-- Content will be dynamically updated here -->
                      <p><em>Work hours is your time spent in work categories and breaks. This is the most accurate depiction
                              of how much time you spend at work for a day.</em></p>
                  </td>
              </tr>
              <!-- Breakdown -->
              <tr>
                  <td style="padding: 10px 20px;">
                      <h3>Breakdown</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                              <th style="text-align: left; padding-right: 10px;">PERCENT</th>
                              <th style="text-align: right;">TOTAL TIME</th>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Focus</td>
                              <td style="text-align: right;"> 19% - 17 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Meetings</td>
                              <td style="text-align: right;">0% - 0 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Breaks</td>
                              <td style="text-align: right;">20% - 18 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Other</td>
                              <td style="text-align: right;">61% - 56 min</td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <!-- Tracked Time -->
              <tr>
                  <td style="padding: 10px 20px;">
                      <h3>Tracked Time</h3>
                      <p>Total Usage: ${totalUsageData.hours} hours, ${totalUsageData.minutes} minutes, ${totalUsageData.seconds} seconds</p>
                      <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                              <td style="width: 70%; text-align: left; padding-right: 10px;">Work categories</td>
                              <td style="text-align: right;">97% - 1 hr 13 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Non-work categories</td>
                              <td style="text-align: right;">3% - 2 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Total</td>
                              <td style="text-align: right;">1 hr 15 min</td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <!-- Categories -->
              <tr>
                  <td style="padding: 10px 20px;">
                      <h3>Categories</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                              <td style="width: 70%; text-align: left; padding-right: 10px;">Code</td>
                              <td style="text-align: right;">74% - 56 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Messaging</td>
                              <td style="text-align: right;">9% - 6 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Utility</td>
                              <td style="text-align: right;">5% - 4 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Email</td>
                              <td style="text-align: right;">3% - 2 min</td>
                          </tr>
                          <tr>
                              <td style="text-align: left; padding-right: 10px;">Miscellaneous</td>
                              <td style="text-align: right;">9% - 8 min</td>
                          </tr>
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
        console.log("Error sending email:", error);
        res.status(500).send("Error sending email");
      } else {
        console.log("Email sent:", info.response);
        res.send("Email sent successfully");
      }
    });
  } catch (error) {
    console.log("Failed to process the request:", error);
    res.status(500).send("Failed to process the request");
  }
});
