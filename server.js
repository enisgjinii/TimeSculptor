const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = "mongodb://localhost:27017/activity_tracker";

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

// Create a new route for calculating total usage for the actual date
// Function to fetch and send total usage data
async function sendTotalUsageData(res) {
  const currentDate = new Date();
  const formattedDate = `${
    currentDate.getMonth() + 1
  }/${currentDate.getDate()}/${currentDate.getFullYear()}`;

  try {
    const totalUsage = await Activity.aggregate([
      {
        $match: {
          date: formattedDate,
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
      console.log("No activities found for the actual date");
      res
        .status(404)
        .json({ error: "No activities found for the actual date" });
    }
  } catch (err) {
    console.error("Error calculating total usage for the actual date:", err);
    res
      .status(500)
      .json({ error: "Failed to calculate total usage for the actual date" });
  }
}

// Route handler for /total_usage
app.get("/total_usage", async (req, res) => {
  // Send the total usage data immediately
  sendTotalUsageData(res);

  // Set up polling to send the total usage data every second
  const intervalId = setInterval(() => {
    sendTotalUsageData(res);
  }, 1000);

  // Clean up the interval when the client disconnects
  req.on("close", () => {
    clearInterval(intervalId);
  });
});
