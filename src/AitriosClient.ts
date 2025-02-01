import { TokenResponse, DeviceInfo, InferenceResult, DecodedInferenceDetail, Inference } from './types';
import * as flatbuffers from 'flatbuffers';
import { SmartCamera } from './objectdetection';

export class AitriosClient {
    private clientId: string;
    private clientSecret: string;
    private tokenUrl: string;
    private baseApiUrl: string;

    constructor(
        clientId: string,
        clientSecret: string,
        tokenUrl: string,
        baseApiUrl: string
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tokenUrl = tokenUrl;
        this.baseApiUrl = baseApiUrl;
    }

    private async getAccessToken(): Promise<string> {
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        
        try {
            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: 'grant_type=client_credentials&scope=system'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as TokenResponse;
            return data.access_token;
        } catch (error) {
            console.error('アクセストークンの取得に失敗しました:', error);
            throw error;
        }
    }

    private async getAuthHeaders(token: string): Promise<HeadersInit> {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async getDeviceInfo(deviceId: string): Promise<DeviceInfo> {
        try {
            const token = await this.getAccessToken();
            const apiUrl = `${this.baseApiUrl}/devices/${deviceId}`;
            const headers = await this.getAuthHeaders(token);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`デバイス情報の取得に失敗しました。ステータス: ${response.status}, エラー: ${JSON.stringify(errorData)}`);
            }

            const deviceInfo = await response.json() as DeviceInfo;
            return deviceInfo;
        } catch (error) {
            console.error('デバイス情報の取得中にエラーが発生しました:', error);
            throw error;
        }
    }

    async getInferences(deviceId: string): Promise<InferenceResult[]> {
        try {
            const token = await this.getAccessToken();
            const apiUrl = `${this.baseApiUrl}/devices/${deviceId}/inferenceresults`;
            const headers = await this.getAuthHeaders(token);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`推論結果の取得に失敗しました。ステータス: ${response.status}, エラー: ${JSON.stringify(errorData)}`);
            }

            const inferenceResults = await response.json() as InferenceResult[];
            return inferenceResults;
        } catch (error) {
            console.error('推論結果の取得中にエラーが発生しました:', error);
            throw error;
        }
    }

    async getInferenceDetail(deviceId: string, inferenceResultId: string): Promise<DecodedInferenceDetail> {
        try {
            const token = await this.getAccessToken();
            const apiUrl = `${this.baseApiUrl}/devices/${deviceId}/inferenceresults/${inferenceResultId}`;
            const headers = await this.getAuthHeaders(token);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`推論結果詳細の取得に失敗しました。ステータス: ${response.status}, エラー: ${JSON.stringify(errorData)}`);
            }

            const inferenceDetail = await response.json() as DecodedInferenceDetail;

            // 推論データのデコード
            if (inferenceDetail.Inferences?.[0]?.O) {
                inferenceDetail.decodedResults = await this.decodeInferenceData(inferenceDetail.Inferences[0].O);
            }

            return inferenceDetail;
        } catch (error) {
            console.error('推論結果詳細の取得中にエラーが発生しました:', error);
            throw error;
        }
    }

    async decodeInferenceData(base64Data: string): Promise<Inference[]> {
        try {
            // Base64デコード
            const decodedData = Buffer.from(base64Data, 'base64');
            
            // flatbuffersを使用してデシリアライズ
            const pplOut = SmartCamera.ObjectDetectionTop.getRootAsObjectDetectionTop(
                new flatbuffers.ByteBuffer(decodedData)
            );
            const readObjData = pplOut.perception();
            if (!readObjData) {
                throw new Error('perception データが null です');
            }
            const resNum = readObjData.objectDetectionListLength();
            const results: Inference[] = [];

            // 検出されたオブジェクトの情報を収集
            for (let i = 0; i < resNum; i++) {
                const objList = readObjData.objectDetectionList(i);
                if (!objList) {
                    continue;
                }
                const unionType = objList.boundingBoxType();
                
                if (unionType === SmartCamera.BoundingBox.BoundingBox2d) {
                    const bbox2d = objList.boundingBox(new SmartCamera.BoundingBox2d());
                    if (!bbox2d) {
                        continue; 
                    }
                    const result: Inference = {
                        class_id: Number(objList.classId()),
                        score: Math.round(Number(objList.score()) * 1000000) / 1000000,
                        left: Number(bbox2d.left()),
                        top: Number(bbox2d.top()),
                        right: Number(bbox2d.right()),
                        bottom: Number(bbox2d.bottom())
                    };
                    results.push(result);
                }
            }
            return results;
        } catch (error) {
            console.error('推論データのデコード中にエラーが発生しました:', error);
            throw error;
        }
    }
} 