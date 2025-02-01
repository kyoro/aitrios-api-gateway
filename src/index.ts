import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AitriosClient } from './AitriosClient';
import { Inference } from './types';

dotenv.config();

const app = express();
const port = 3000;

// Allow all origins
app.use(cors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*'
}));

const client = new AitriosClient(
    process.env.CLIENT_ID!,
    process.env.CLIENT_SECRET!,
    process.env.TOKEN_URL!,
    process.env.BASE_API_URL!
);

// Get device information API
app.get('/devices/:id', async (req: Request, res: Response) => {
    try {
        const deviceId = req.params.id;
        const deviceInfo = await client.getDeviceInfo(deviceId);
        res.json(deviceInfo);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to get device information' });
    }
});

// Get detected objects API
app.get('/devices/:id/result', (async (req: Request, res: Response) => {
    try {
        const deviceId = req.params.id;
        
        // Get inference results
        const inferenceResults = await client.getInferences(deviceId);
        if (!inferenceResults || inferenceResults.length === 0) {
            return res.status(404).json({ error: 'Inference results not found' });
        }

        console.log("Count of inference results");
        console.log(inferenceResults.length);
        // Get details of the latest inference result
        const firstInferenceId = inferenceResults[0].id;
        const detail = await client.getInferenceDetail(deviceId, firstInferenceId);

        console.log("Inference results");
        console.log(detail);

        const response = {
            timestamp: detail._ts,
            deviceId: detail.DeviceID,
            modelId: detail.ModelID,
            detectedObjects: detail.decodedResults || []
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to get detected objects' });
    }
}) as RequestHandler);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error occurred' });
});

// Start server
app.listen(port, () => {
    console.log(`Server started: http://localhost:${port}`);
}); 
