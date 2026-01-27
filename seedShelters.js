import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Shelter } from './models/Shelter.js';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safe';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB for seeding:', MONGODB_URI.split('@').pop()))
    .catch(err => console.error('Connection error:', err));

// Coordinates for initial shelter seeding
const shelters = [
    {
        name: 'Main Community Center',
        address: 'Downtown Area',
        location: { lat: 12.9352, lng: 77.6245 },
        capacity: '200/500',
        status: 'Open',
        notes: 'Primary assembly point. Medical staff on site.',
        distance: '1.2 km'
    },
    {
        name: 'Central High School',
        address: 'Academic District',
        location: { lat: 12.9719, lng: 77.6412 },
        capacity: '50/300',
        status: 'Open',
        notes: 'Bring own bedding if possible.',
        distance: '3.5 km'
    },
    {
        name: 'City Stadium',
        address: 'Sports Complex',
        location: { lat: 12.9698, lng: 77.5958 },
        capacity: 'Full',
        status: 'Full',
        notes: 'Currently at max capacity. Redirecting to backup sites.',
        distance: '2.0 km'
    }
];

const seedDB = async () => {
    await Shelter.deleteMany({});
    await Shelter.insertMany(shelters);
    console.log('Shelters seeded!');
    mongoose.connection.close();
};

seedDB();
