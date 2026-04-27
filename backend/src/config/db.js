import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        console.log(`Database name: ${conn.connection.db.databaseName}`);
    } catch (error) {
        console.error(`Error connecting while database ${error.message}`);
        process.exit(1);
    }
}