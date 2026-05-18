# Velora — Intelligent Semantic Search Engine

Velora is a premium, AI-powered semantic search platform designed to bypass the limitations of traditional keyword search. **It is built exclusively to index and search MongoDB Documents** (text, titles, and metadata). By leveraging local NLP vector embeddings and the native power of **MongoDB Atlas Vector Search**, Velora understands the *meaning* and *context* of your queries, instantly delivering highly relevant results directly from your cloud database. 

It is designed to feel like a modern, enterprise-ready SaaS application, perfect for managing organizational knowledge, code snippets, or text documentation.

---

## 🚀 Key Features

*   **Semantic Vector Search:** Understands the meaning behind questions to find documents even if exact keywords aren't used.
*   **Live Document Vectorization:** Uploading a new document instantly triggers the AI to process it, generate mathematical embeddings, and save it to the cloud.
*   **Premium Glassmorphism UI:** A sleek, beautiful, and highly responsive Emerald-themed SaaS interface.
*   **Real-time Analytics & Audit Logs:** Monitor recent search queries, user activity, and critical security insights on the dashboard.
*   **Team Memory:** Save valuable query results to a shared workspace for team collaboration.
*   **Ranking Policies:** Admin control to boost, penalize, or filter specific types of documents dynamically.



## 🛠️ Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, Framer Motion (Animations), Lucide (Icons)
*   **Backend:** Node.js, Express.js, Mongoose (ODM)
*   **Database:** MongoDB Atlas (Cloud) with `$vectorSearch`
*   **AI Microservice:** Python, FastAPI, SentenceTransformers (`all-MiniLM-L6-v2`)

---

## 🧠 How It Works & Project Architecture

Velora operates using a seamless microservices architecture:

1.  **User Input (Frontend):** The user submits a natural language query via the React interface.
2.  **API Routing (Backend):** The query is securely routed through the Node.js/Express Backend.
3.  **Vectorization (AI Service):** The backend forwards the text to the local Python AI Microservice. This service runs a machine learning NLP model to convert the text into a dense vector (an array of hundreds of numbers representing the semantic meaning).
4.  **Similarity Matching (Database):** The Backend queries MongoDB Atlas, comparing the query vector against the embeddings of all stored documents using an HNSW index to find the closest mathematical matches.
5.  **Instant Delivery:** The database returns the most contextually relevant documents, which the backend formats and sends back to the frontend UI.

---

## ⚙️ Installation & Local Setup

### Prerequisites
*   Node.js (v18+)
*   Python 3.9+
*   MongoDB Atlas Account (Make sure your Network Access is set to `0.0.0.0/0` to allow connections).

### Step 1: Install Dependencies
Open your terminal and install dependencies for all three services:

```bash
# 1. Frontend
cd frontend
npm install

# 2. Backend
cd ../backend
npm install

# 3. AI Service
cd ../ai-service
pip install -r requirements.txt
```

### Step 2: Environment Variables
Ensure you have `.env` files set up in both the backend and frontend directories.

**`backend/.env`**
```env
PORT=5000
MONGO_URI=mongodb+srv://<your_username>:<your_password>@<your_cluster_url>/velora?retryWrites=true&w=majority
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=super_secret_jwt_key
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Run the Application
You will need to open **three separate terminal instances** to run the services simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (AI Microservice):**
```bash
cd ai-service
python main.py
```

**Terminal 3 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will start, and the frontend will be available at `http://localhost:5173`. You can now upload documents and test the semantic search!
