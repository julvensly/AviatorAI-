import express from 'express';
import cors from 'cors';

import authRoutes from './src/routes/authRoutes.js';
import relationshipRoutes from './src/routes/relationshipRoutes.js';
import analysisRoutes from './src/routes/analysisRoutes.js';
import betRoutes from './src/routes/betRoutes.js';
import roundEngineRoutes from './src/routes/roundEngineRoutes.js';
import intervalRoutes from './src/routes/intervalRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';

import { startEngine } from './src/services/roundEngineService.js';
import { initializeIntervalSystem } from './src/services/intervalStartupService.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'AviatorAI',
    status: 'online'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/relationship', relationshipRoutes);
app.use('/api/engine', roundEngineRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/intervals', intervalRoutes);
app.use('/api/wallet', walletRoutes);

async function bootstrap() {
  try {
    console.log('Initializing interval system...');

    const initialized = await initializeIntervalSystem();

    if (!initialized.success) {
      throw new Error(initialized.message);
    }

    const processedRounds = initialized.restoration.processedRounds;
    const nextRound = processedRounds + 1;

    console.log('Interval restoration:', initialized.restoration);
    console.log(`Next round: ${nextRound}`);

    const engine = startEngine({
      startRound: nextRound
    });

    if (engine?.success === false) {
      throw new Error(engine.message);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AviatorAI running on port ${PORT}`);
      console.log(`Round engine started at round ${nextRound}.`);
    });

  } catch (error) {
    console.error('SERVER STARTUP FAILED:', error.message);
    process.exit(1);
  }
}

bootstrap();
