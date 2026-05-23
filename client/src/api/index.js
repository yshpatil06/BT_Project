import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  updateFile: (projectId, fileId, content) =>
    api.patch(`/projects/${projectId}/files/${fileId}`, { content }),
  addFile: (projectId, data) => api.post(`/projects/${projectId}/files`, data),
  deleteFile: (projectId, fileId) => api.delete(`/projects/${projectId}/files/${fileId}`),
};

export const packagesAPI = {
  install: (packageName, projectId) =>
    api.post('/packages/install', { packageName, projectId }),
  search: (q) => api.get(`/packages/search?q=${encodeURIComponent(q)}`),
};

export default api;
