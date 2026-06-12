import axios from "axios";
import { getToken } from "./firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 15000,
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

// Customers
export const getCustomers = (params) => api.get("/customers", { params });
export const getCustomerStats = () => api.get("/customers/stats");
export const getCustomerById = (id) => api.get(`/customers/${id}`);

// Segments
export const getSegments = () => api.get("/segments");
export const getSegmentById = (id) => api.get(`/segments/${id}`);
export const getSegmentCustomers = (id) => api.get(`/segments/${id}/customers`);
export const createSegment = (data) => api.post("/segments", data);
export const previewSegment = (rules) => api.post("/segments/preview", { rules });
export const deleteSegment = (id) => api.delete(`/segments/${id}`);

// Campaigns
export const getCampaigns = () => api.get("/campaigns");
export const getCampaignById = (id) => api.get(`/campaigns/${id}`);
export const getCampaignMessages = (id) => api.get(`/campaigns/${id}/messages`);
export const createCampaign = (data) => api.post("/campaigns", data);
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`);

// Analytics
export const getOverview = () => api.get("/analytics/overview");
export const getCampaignAnalytics = (id) => api.get(`/analytics/campaign/${id}`);
export const getTrends = () => api.get("/analytics/trends");

// AI
export const aiChat = (messages, context) => api.post("/ai/chat", { messages, context });
export const parseSegment = (intent) => api.post("/ai/parse-segment", { intent });
export const draftMessage = (segmentDescription, intent) =>
  api.post("/ai/draft-message", { segmentDescription, intent });

export default api;
