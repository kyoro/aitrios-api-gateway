import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import dotenv from 'dotenv';
import { AitriosClient } from './AitriosClient';
import { Inference } from './types';

dotenv.config();

const app = express();
const port = 3000;

const client = new AitriosClient(
    process.env.CLIENT_ID!,
    process.env.CLIENT_SECRET!,
    process.env.TOKEN_URL!,
    process.env.BASE_API_URL!
);

// デバイス情報取得API
app.get('/devices/:id', async (req: Request, res: Response) => {
    try {
        const deviceId = req.params.id;
        const deviceInfo = await client.getDeviceInfo(deviceId);
        res.json(deviceInfo);
    } catch (error) {
        console.error('エラー:', error);
        res.status(500).json({ error: 'デバイス情報の取得に失敗しました' });
    }
});

// 検出オブジェクト取得API
app.get('/devices/:id/result', (async (req: Request, res: Response) => {
    try {
        const deviceId = req.params.id;
        
        // 推論結果の取得
        const inferenceResults = await client.getInferences(deviceId);
        if (!inferenceResults || inferenceResults.length === 0) {
            return res.status(404).json({ error: '推論結果が見つかりません' });
        }

        // 最新の推論結果の詳細を取得
        const firstInferenceId = inferenceResults[0].id;
        const detail = await client.getInferenceDetail(deviceId, firstInferenceId);

        // レスポンスの整形
        const response = {
            timestamp: detail.Inferences?.[0]?.T,
            deviceId: detail.DeviceID,
            modelId: detail.ModelID,
            detectedObjects: detail.decodedResults || []
        };

        res.json(response);
    } catch (error) {
        console.error('エラー:', error);
        res.status(500).json({ error: '検出オブジェクトの取得に失敗しました' });
    }
}) as RequestHandler);

// エラーハンドリング
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('エラー:', err);
    res.status(500).json({ error: '内部サーバーエラーが発生しました' });
});

// サーバー起動
app.listen(port, () => {
    console.log(`サーバーが起動しました: http://localhost:${port}`);
}); 
