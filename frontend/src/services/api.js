import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const predictText     = (text, source="user")   => api.post("/sentiment/predict",       { text, source });
export const predictBatch    = (texts, source="batch")  => api.post("/sentiment/predict/batch", { texts, source });
export const getHistory      = (params={})              => api.get("/sentiment/history",         { params });
export const getSentStats    = ()                       => api.get("/sentiment/stats");
export const getModelMetrics = ()                       => api.get("/sentiment/metrics");
export const getDatasetStats = ()                       => api.get("/sentiment/dataset/stats");
export const retrainModel    = ()                       => api.post("/sentiment/retrain");
export const getTwitterFeed  = (params={})              => api.get("/feed/twitter", { params : { sample: "false", ...params } });
export const getNewsFeed     = (params={})              => api.get("/feed/news",    { params : { sample: "false", ...params } });
export const healthCheck     = ()                       => api.get("/health");

export default api;
