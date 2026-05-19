// Empty string uses Vite dev proxy (/api -> localhost:5000)
function normalizeApiBase(url) {
  if (!url) return "";
  return url.replace(/\/api\/?$/, "").replace(/\/$/, "");
}
const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL ?? "");

async function parseError(res) {
  try {
    const data = await res.json();
    return data.error || data.message || "Request failed";
  } catch {
    return "Request failed";
  }
}

function mapHistoryItem(q) {
  const type = q.activityType || "search";
  return {
    id: q._id,
    query_text: q.query,
    intent: type === "search" ? "search" : type.charAt(0).toUpperCase() + type.slice(1),
    search_mode: type === "search" ? "semantic" : type,
    was_successful: (q.resultCount ?? 0) > 0 || type !== "search",
    created_date: q.createdAt,
    result_count: q.resultCount,
    _type: type,
    refId: q.refId,
  };
}

/** Keep the latest audit entry per unique action (refId or query text). */
function dedupeAuditLogs(entries) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
  );
  const seen = new Set();

  return sorted.filter((entry) => {
    const action = entry.action || "search";
    const key = entry.refId
      ? `${action}:${entry.refId}`
      : `${action}:${(entry.details || "").trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapDocument(d) {
  const category = d.metadata?.category || d.category || "general";
  return {
    ...d,
    id: d._id,
    category: typeof category === "string" ? category.toLowerCase() : "general",
    source: d.metadata?.source || d.source,
    tags: d.metadata?.tags || d.tags || [],
    access_level: d.metadata?.access_level || d.access_level || "public",
    created_date: d.metadata?.dateAdded || d.createdAt,
  };
}

export const apiClient = {
  search: {
    suggestions: async (query) => {
      if (!query || query.trim().length < 2) return [];
      try {
        const res = await fetch(
          `${API_BASE}/api/search/suggestions?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.suggestions || [];
      } catch {
        return [];
      }
    },
  },
  dashboard: {
    getStats: async () => {
      const res = await fetch(`${API_BASE}/api/history/dashboard`);
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
  },
  entities: {
    SearchPolicy: {
      list: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/policies`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.map((p) => ({ ...p, id: p._id, created_date: p.createdAt }));
        } catch {
          return [];
        }
      },
      update: async (id, data) =>
        fetch(`${API_BASE}/api/policies/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        }),
      create: async (data) => {
        const res = await fetch(`${API_BASE}/api/policies`, {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(await parseError(res));
        const p = await res.json();
        return { ...p, id: p._id, created_date: p.createdAt };
      },
      delete: async (id) =>
        fetch(`${API_BASE}/api/policies/${id}`, { method: "DELETE" }),
    },
    AuditLog: {
      list: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/history`);
          if (!res.ok) return [];
          const data = await res.json();
          const mapped = data.map((q) => ({
            id: q._id,
            refId: q.refId,
            action: q.activityType || "search",
            severity:
              q.activityType === "document_delete" || q.resultCount === 0
                ? "warning"
                : "info",
            user_id: q.userId || "system@velora.ai",
            ip_address: "127.0.0.1",
            created_date: q.createdAt,
            details: q.query,
          }));
          return dedupeAuditLogs(mapped);
        } catch {
          return [];
        }
      },
    },
    SearchQuery: {
      list: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/history`);
          const data = res.ok ? await res.json() : [];
          const mapped = data.map(mapHistoryItem);
          const seen = new Set();
          return mapped
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
            .filter((item) => {
              const key = item.refId
                ? `${item._type}:${item.refId}`
                : `${item._type}:${(item.query_text || "").trim().toLowerCase()}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
        } catch {
          return [];
        }
      },
      clearAll: async () => {
        const res = await fetch(`${API_BASE}/api/history`, { method: "DELETE" });
        if (!res.ok) throw new Error(await parseError(res));
        return res.json();
      },
      delete: async (id) => {
        const res = await fetch(`${API_BASE}/api/history/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await parseError(res));
        return res.json();
      },
      logActivity: async (payload) => {
        const res = await fetch(`${API_BASE}/api/history/activity`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(await parseError(res));
        return res.json();
      },
    },
    SearchDocument: {
      list: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/documents`);
          const data = res.ok ? await res.json() : [];
          return data.map(mapDocument);
        } catch {
          return [];
        }
      },
      create: async (data) => {
        const userId = data.userId || (await getCurrentUserId());
        const payload = {
          title: data.title,
          content: data.content || data.title,
          category: data.category || "general",
          source: data.source || "User Upload",
          tags: data.tags || [],
          access_level: data.access_level || "public",
          userId,
        };
        const res = await fetch(`${API_BASE}/api/documents`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(await parseError(res));
        const doc = await res.json();
        return mapDocument(doc);
      },
      delete: async (id) => {
        const res = await fetch(`${API_BASE}/api/documents/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await parseError(res));
        return res.json();
      },
      deleteAll: async () => {
        const res = await fetch(`${API_BASE}/api/documents`, { method: "DELETE" });
        if (!res.ok) throw new Error(await parseError(res));
        return res.json();
      },
    },
    Feedback: {
      list: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/feedback`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.map((f) => ({ ...f, id: f._id, created_date: f.createdAt }));
        } catch {
          return [];
        }
      },
      create: async (data) => {
        const res = await fetch(`${API_BASE}/api/feedback`, {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(await parseError(res));
        const entry = await res.json();
        return { ...entry, id: entry._id, created_date: entry.createdAt };
      },
      delete: async (id) => {
        await fetch(`${API_BASE}/api/feedback/${id}`, { method: "DELETE" });
      },
    },
  },
  auth: {
    me: async () => {
      const stored = localStorage.getItem("mock_User");
      if (stored) return JSON.parse(stored);
      return {
        full_name: "Admin",
        email: "admin@velora.ai",
        role: "admin",
        created_date: new Date().toISOString(),
      };
    },
    updateMe: async (data) => {
      const stored = localStorage.getItem("mock_User");
      const current = stored
        ? JSON.parse(stored)
        : {
            full_name: "Admin",
            email: "admin@velora.ai",
            role: "admin",
            created_date: new Date().toISOString(),
          };
      localStorage.setItem("mock_User", JSON.stringify({ ...current, ...data }));
    },
    logout: () => {},
  },
  integrations: {
    Core: {
      SendEmail: async () => {},
      UploadFile: async () => ({ file_url: "mock_url" }),
      ExtractDataFromUploadedFile: async () => ({
        output: {
          text_content:
            "This is extracted text from the uploaded file (mock). Add content in the text area for full indexing.",
        },
      }),
    },
  },
};
export const logUserAction = (action, details) => console.log(action, details);

export async function getCurrentUserId() {
  try {
    const user = await apiClient.auth.me();
    return user.email || user.full_name || "admin@velora.ai";
  } catch {
    return "admin@velora.ai";
  }
}
