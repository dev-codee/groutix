const { MongoClient, ObjectId } = require("mongodb");

const SAMPLE_LEADS = [
  {
    name: "Nancy Cosma",
    phone: "0412 345 678",
    email: "nancy.cosma@example.com",
    address: "31 Greenwich Crescent, Bundoora",
    city: "Bundoora",
    type: "inspection",
    time: "08:00",
    date: "2026-10-07",
    jobNo: "GX-2610-001",
    service: "Shower Regrouting & Tile Sealing",
    status: "Inspection Scheduled"
  },
  {
    name: "Celia Cannavan",
    phone: "0423 456 789",
    email: "celia.cannavan@example.com",
    address: "303c 142 Rouse St, Port Melbourne",
    city: "Port Melbourne",
    type: "inspection",
    time: "09:00",
    date: "2026-10-07",
    jobNo: "GX-2610-002",
    service: "Balcony Waterproofing Inspection",
    status: "Inspection Scheduled"
  },
  {
    name: "Brenda Williams",
    phone: "0434 567 890",
    email: "brenda.williams@example.com",
    address: "6 Ida Street, Niddrie",
    city: "Niddrie",
    type: "inspection",
    time: "10:00",
    date: "2026-10-07",
    jobNo: "GX-2610-003",
    service: "Bathroom Tile Re-grouting",
    status: "Inspection Scheduled"
  },
  {
    name: "Leanne Wang",
    phone: "0445 678 901",
    email: "leanne.wang@example.com",
    address: "1a Austral Avenue, Preston",
    city: "Preston",
    type: "inspection",
    time: "11:00",
    date: "2026-10-07",
    jobNo: "GX-2610-004",
    service: "Leaking Shower Assessment",
    status: "Inspection Scheduled"
  },
  {
    name: "PETER CHEN",
    phone: "0456 789 012",
    email: "peter.chen@example.com",
    address: "35 Greenways Road, Glen Waverley",
    city: "Glen Waverley",
    type: "inspection",
    time: "16:00",
    date: "2026-10-07",
    jobNo: "GX-2610-005",
    service: "Epoxy Grouting Inspection",
    status: "Inspection Scheduled"
  },
  {
    name: "Andrew Romaniotis",
    phone: "0467 890 123",
    email: "andrew.romaniotis@example.com",
    address: "3/34 Sparks Avenue, Fairfield",
    city: "Fairfield",
    type: "inspection",
    time: "17:00",
    date: "2026-10-07",
    jobNo: "GX-2610-006",
    service: "Floor Tile Regrout & Polish",
    status: "Inspection Scheduled"
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found");
    return;
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  console.log("Connected to MongoDB:", db.databaseName);

  const subCol = db.collection("submissions");
  const bookCol = db.collection("bookings");

  for (const item of SAMPLE_LEADS) {
    // Check if submission already exists by name/address
    let sub = await subCol.findOne({ address: item.address });
    if (!sub) {
      const subDoc = {
        type: "lead",
        status: item.status,
        name: item.name,
        phone: item.phone,
        email: item.email,
        address: item.address,
        city: item.city,
        jobNo: item.jobNo,
        service: item.service,
        inspectionAt: `${item.date}T${item.time}:00`,
        createdAt: new Date()
      };
      const res = await subCol.insertOne(subDoc);
      sub = { ...subDoc, _id: res.insertedId };
      console.log("Created submission for:", item.name, sub._id.toString());
    } else {
      await subCol.updateOne(
        { _id: sub._id },
        { $set: { inspectionAt: `${item.date}T${item.time}:00` } }
      );
    }

    const leadId = sub._id.toString();
    const existingBooking = await bookCol.findOne({ date: item.date, time: item.time });
    if (!existingBooking) {
      await bookCol.insertOne({
        leadId,
        type: item.type,
        date: item.date,
        time: item.time,
        zone: "flexible",
        suburb: item.city,
        reference: item.jobNo,
        createdAt: new Date()
      });
      console.log("Created booking for:", item.name, item.date, item.time);
    }
  }

  console.log("Seeding complete!");
  await client.close();
}

seed().catch(console.error);
