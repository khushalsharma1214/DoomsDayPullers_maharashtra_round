import express from 'express';
import queueRoutes from './routes/queueRoutes';
import { config } from './config';

const app = express();

// Parse incoming JSON requests
app.use(express.json());

// Mount the queue routes
app.use('/api/queue', queueRoutes);

app.listen(config.PORT, () => {
    console.log(`Fair Drop server running on http://localhost:${config.PORT}`);
});