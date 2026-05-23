import { useState, useEffect, useCallback, useRef } from 'react';
import { projectsAPI, packagesAPI } from '../api';

export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const saveTimerRef = useRef(null);
  const wsRef = useRef(null);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    projectsAPI.getOne(projectId)
      .then(res => setProject(res.data))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  // WebSocket for real-time collab
  useEffect(() => {
    if (!projectId) return;
    const wsUrl = `ws://${window.location.host}/ws?projectId=${projectId}`;
    try {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'PROJECT_UPDATED') setProject(msg.project);
      };
    } catch { /* ws optional */ }
    return () => wsRef.current?.close();
  }, [projectId]);

  // Auto-save with debounce
  const debounceSave = useCallback((updatedProject) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await projectsAPI.update(updatedProject._id, updatedProject);
      } catch { /* ignore save errors */ }
      setSaving(false);
    }, 800);
  }, []);

  const updateFileContent = useCallback((fileId, content) => {
    setProject(prev => {
      if (!prev) return prev;
      const updated = { ...prev, files: prev.files.map(f => f.id === fileId ? { ...f, content } : f) };
      debounceSave(updated);
      return updated;
    });
  }, [debounceSave]);

  const addFile = useCallback(async (name, type = 'file', parentId = null) => {
    const res = await projectsAPI.addFile(projectId, { name, type, parentId });
    setProject(res.data);
    return res.data;
  }, [projectId]);

  const deleteFile = useCallback(async (fileId) => {
    const res = await projectsAPI.deleteFile(projectId, fileId);
    setProject(res.data);
  }, [projectId]);

  const renameFile = useCallback(async (fileId, newName) => {
    setProject(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        files: prev.files.map(f => f.id === fileId ? { ...f, name: newName, path: `/${newName}` } : f),
      };
      debounceSave(updated);
      return updated;
    });
  }, [debounceSave]);

  const setActiveFile = useCallback(async (fileId) => {
    setProject(prev => prev ? { ...prev, activeFileId: fileId } : prev);
    try {
      await projectsAPI.update(projectId, { activeFileId: fileId });
    } catch { /* ignore */ }
  }, [projectId]);

  const installPackage = useCallback(async (packageName) => {
    const res = await packagesAPI.install(packageName, projectId);
    const { package: pkg } = res.data;
    setProject(prev => {
      if (!prev) return prev;
      const packages = [...new Set([...(prev.packages || []), pkg.name])];
      const updated = { ...prev, packages };
      debounceSave(updated);
      return updated;
    });
    return res.data;
  }, [projectId, debounceSave]);

  const removePackage = useCallback(async (pkgName) => {
    setProject(prev => {
      if (!prev) return prev;
      const packages = prev.packages.filter(p => p !== pkgName);
      const updated = { ...prev, packages };
      debounceSave(updated);
      return updated;
    });
  }, [debounceSave]);

  return {
    project, loading, saving, error,
    updateFileContent, addFile, deleteFile, renameFile,
    setActiveFile, installPackage, removePackage,
    activeFile: project?.files?.find(f => f.id === project.activeFileId) || project?.files?.[0],
  };
}
