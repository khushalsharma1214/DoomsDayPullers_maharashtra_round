import express from 'express';
import dropRoutes from './routes/dropRoutes.js';
import { initializeInventory } from './services/ticketService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount the ticket drop routes
app.use('/api/drop', dropRoutes);

// Initialize the 500 seats on startup
initializeInventory().catch(console.error);

app.listen(PORT, () => {
    console.log(`Fair Drop Anti-Bot Server running on http://localhost:${PORT}`);
});