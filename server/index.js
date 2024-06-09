const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/appData', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define Schema and Model for Active App Data
const activeAppSchema = new mongoose.Schema({
    title: String,
    id: Number,
    bounds: {
        x: Number,
        y: Number,
        height: Number,
        width: Number
    },
    owner: {
        name: String,
        processId: Number,
        bundleId: String,
        path: String
    },
    url: String,
    memoryUsage: Number,
    timestamp: { type: Date, default: Date.now }
});
const ActiveApp = mongoose.model('ActiveApp', activeAppSchema);

// Routes
app.use(express.json()); // Middleware to parse JSON request body
app.get('/', (req, res) => {
    res.send('Express server is running!');
});

// Save Active App Data to MongoDB
app.post('/active-app', async (req, res) => {
    const activeAppData = req.body;
    const newActiveApp = new ActiveApp(activeAppData);
    await newActiveApp.save();
    res.send('Active app data saved to MongoDB');
});

// Delete Active App Data from MongoDB by ID
app.delete('/activities/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const deletedActivity = await ActiveApp.findByIdAndDelete(id);
        if (deletedActivity) {
            res.status(200).json({ message: 'Record deleted successfully' });
        } else {
            res.status(404).json({ error: 'Record not found' });
        }
    } catch (error) {
        console.error('Error deleting record:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch activities for a specific date
app.get('/activities/:date', async (req, res) => {
    try {
        // Parse the date parameter from the request URL
        const dateString = req.params.date;
        const date = new Date(dateString);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        // Calculate the start and end of the day for the given date
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        // Fetch activities from MongoDB for the specified date
        const activities = await ActiveApp.find({
            timestamp: { $gte: startOfDay, $lt: endOfDay } // Filter activities for the specified date
        }).sort({ timestamp: -1 }).limit(10); // Fetching latest 10 activities, adjust as needed
        // Send activities to the client
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Additional route to handle fetching activities for today
app.get('/activities', async (req, res) => {
    try {
        // Get today's date
        const today = new Date();
        // Calculate the start and end of the day for today
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        // Fetch activities from MongoDB for today
        const activities = await ActiveApp.find({
            timestamp: { $gte: startOfDay, $lt: endOfDay }
        }).sort({ timestamp: -1 }).limit(10);
        // Send activities to the client
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities for today:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Additional route to handle fetching activities for the next available date
app.get('/activities/next', async (req, res) => {
    try {
        // Logic to fetch activities for the next available date (e.g., days -2 from today)
        // Modify this logic as per your requirements
        // This is just a placeholder for demonstration purposes
        // You can implement your own logic here
        res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
        console.error('Error fetching activities for next date:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch all activities and group by processId with start and end times
app.get('/grouped-activities', async (req, res) => {
    try {
        const activities = await ActiveApp.find().sort({ timestamp: 1 });
        const groupedActivities = groupAndCalculateActivities(activities);
        res.json(groupedActivities);
    } catch (error) {
        console.error('Error fetching grouped activities:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function groupAndCalculateActivities(activities) {
    const grouped = activities.reduce((acc, activity) => {
        const processId = activity.owner.processId;
        if (!acc[processId]) {
            acc[processId] = [];
        }
        acc[processId].push(activity);
        return acc;
    }, {});

    const result = Object.keys(grouped).map(processId => {
        const activityGroup = grouped[processId];
        return {
            processId,
            ownerName: activityGroup[0].owner.name,
            start: activityGroup[0].timestamp,
            end: activityGroup[activityGroup.length - 1].timestamp,
            activities: activityGroup.map(activity => ({
                title: activity.title,
                timestamp: activity.timestamp,
                memoryUsage: activity.memoryUsage
            }))
        };
    });

    return result;
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
