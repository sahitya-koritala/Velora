const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
        return res.json();
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
          return data.map((q) => ({
            id: q._id,
            action: q.activityType || "search",
            severity: q.resultCount === 0 ? "warning" : "info",
            user_id: q.userId || "demo_user",
            ip_address: "127.0.0.1",
            created_date: q.createdAt,
            details: q.query,
          }));
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
          return data.map(mapHistoryItem);
        } catch {
          return [];
        }
      },
      clearAll: async () => {
        const res = await fetch(`${API_BASE}/api/history`, { method: "DELETE" });
        if (!res.ok) throw new Error(await parseError(res));
        localStorage.removeItem("mock_Feedback");
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
        const payload = {
          title: data.title,
          content: data.content || data.title,
          category: data.category || "general",
          source: data.source || "User Upload",
          tags: data.tags || [],
          access_level: data.access_level || "public",
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
    },
    Feedback: {
      list: async () => {
        try {
          return JSON.parse(localStorage.getItem("mock_Feedback")) || [];
        } catch {
          return [];
        }
      },
      create: async (data) => {
        const existing = JSON.parse(localStorage.getItem("mock_Feedback")) || [];
        const entry = {
          ...data,
          id: Date.now().toString(),
          created_date: new Date().toISOString(),
        };
        existing.push(entry);
        localStorage.setItem("mock_Feedback", JSON.stringify(existing));
        await apiClient.entities.SearchQuery.logActivity({
          query: `Feedback: ${(data.message || "").substring(0, 50)}`,
          activityType: "feedback",
          refId: entry.id,
        }).catch(() => {});
        return entry;
      },
      delete: async (id) => {
        const existing = JSON.parse(localStorage.getItem("mock_Feedback")) || [];
        localStorage.setItem(
          "mock_Feedback",
          JSON.stringify(existing.filter((f) => f.id !== id))
        );
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
