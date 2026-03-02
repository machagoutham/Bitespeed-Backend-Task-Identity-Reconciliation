import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import identifyRoute from './routes/identify.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/identify', identifyRoute);

app.get('/', (_, res) => res.send('✅ Bitespeed Identity Reconciliation API is running'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});