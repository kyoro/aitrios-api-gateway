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
            console.error('Failed to get access token:', error);
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
                throw new Error(`Failed to get device information. Status: ${response.status}, Error: ${JSON.stringify(errorData)}`);
            }

            const deviceInfo = await response.json() as DeviceInfo;
            return deviceInfo;
        } catch (error) {
            console.error('Error occurred while getting device information:', error);
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
                throw new Error(`Failed to get inference results. Status: ${response.status}, Error: ${JSON.stringify(errorData)}`);
            }

            const inferenceResults = await response.json() as InferenceResult[];
            return inferenceResults;
        } catch (error) {
            console.error('Error occurred while getting inference results:', error);
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
                throw new Error(`Failed to get inference result details. Status: ${response.status}, Error: ${JSON.stringify(errorData)}`);
            }

            const inferenceDetail = await response.json() as DecodedInferenceDetail;

            // Decode inference data
            if (inferenceDetail.Inferences?.[0]?.O) {
                inferenceDetail.decodedResults = await this.decodeInferenceData(inferenceDetail.Inferences[0].O);
            }

            return inferenceDetail;
        } catch (error) {
            console.error('Error occurred while getting inference result details:', error);
            throw error;
        }
    }

    async decodeInferenceData(base64Data: string): Promise<Inference[]> {
        try {
            // Decode Base64
            const decodedData = Buffer.from(base64Data, 'base64');
            
            // Deserialize using flatbuffers
            const pplOut = SmartCamera.ObjectDetectionTop.getRootAsObjectDetectionTop(
                new flatbuffers.ByteBuffer(decodedData)
            );
            const readObjData = pplOut.perception();
            if (!readObjData) {
                throw new Error('perception data is null');
            }
            const resNum = readObjData.objectDetectionListLength();
            const results: Inference[] = [];

            // Collect information about detected objects
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
            console.error('Error occurred while decoding inference data:', error);
            throw error;
        }
    }
} 