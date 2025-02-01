export interface TokenResponse {
    access_token: string;
    [key: string]: any;
}

export interface DeviceInfo {
    [key: string]: any;
}

export interface InferenceResult {
    id: string;
    [key: string]: any;
}

export interface InferenceDetail {
    DeviceID: string;
    ModelID: string;
    Image: boolean;
    Inferences: {
        T: string;
        O?: string;
    }[];
    id: string;
    project_id: string;
    _ts: number;
}

export interface Inference {
    class_id: number;
    score: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface DecodedInferenceDetail extends InferenceDetail {
    decodedResults?: Inference[];
} 