const MongoClient = require('mongodb').MongoClient;
const moment = require('moment-timezone');
const uri = 'mongodb://localhost:27017/';
const dbName = 'TimeSculptor';

let client;

async function connectToDatabase() {
    try {
        client = new MongoClient(uri, { useUnifiedTopology: true });
        await client.connect();
        console.log('Lidhja me MongoDB u krye me sukses.');
    } catch (error) {
        console.error('Dështoi lidhja me MongoDB:', error);
        process.exit(1); // Dal nga procesi me një kod gabimi
    }
}


function getCurrentTime() {
    try {
        // Gjeje zonën kohore lokale të pajisjes duke përdorur paketën 'intl'
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Përdor zonën kohore të gjetur për të marrë kohën aktuale
        return moment().tz(timeZone).toDate();
    } catch (error) {
        console.error('Gabim gjatë përpilimit të kohës aktuale:', error);
        // Kthe kohën aktuale në rast se nuk mund të përcaktohet zona kohore
        return new Date();
    }
}

async function insertTimeEntry(entry) {
    try {
        if (!client.topology || !client.topology.isConnected()) {
            console.log('Rilidhje me MongoDB...');
            await connectToDatabase();
        }
        const db = client.db(dbName);
        const collection = db.collection('timeEntries');
        const result = await collection.insertOne(entry);
        if (result && result.ops && result.ops.length > 0) {
            console.log('Regjistrimi i kohës u fut:', result.ops[0]);
            return result.ops[0]; // Kthe dokumentin e futur
        } else {
            console.error('Futja dështoi: Nuk u fut asnjë dokument.');
            return null;
        }
    } catch (error) {
        console.error('Gabim gjatë futjes së regjistrimit të kohës:', error);
        throw error; // Rikthej gabimin për të trajtuar nga thirrësi
    }
}

async function updateTimeEntry(entryId, endTime) {
    try {
        if (!client.topology || !client.topology.isConnected()) {
            console.log('Rilidhje me MongoDB...');
            await connectToDatabase();
        }
        const db = client.db(dbName);
        const collection = db.collection('timeEntries');
        const result = await collection.updateOne({ _id: entryId }, { $set: { endTime: endTime } });
        if (result.matchedCount === 0) {
            console.error(`Përditësimi dështoi: Nuk u gjet dokumenti me _id: ${entryId}`);
        } else if (result.modifiedCount === 0) {
            console.error(`Përditësimi dështoi: Dokumenti me _id: ${entryId} nuk u përditësua.`);
        } else {
            console.log(`Regjistrimi i kohës u përditësua për _id: ${entryId}`);
        }
    } catch (error) {
        console.error('Gabim gjatë përditësimit të regjistrimit të kohës:', error);
        throw error; // Rikthej gabimin për të trajtuar nga thirrësi
    }
}

module.exports = {
    connectToDatabase,
    insertTimeEntry,
    updateTimeEntry
};
