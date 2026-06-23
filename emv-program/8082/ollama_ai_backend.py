#!/usr/bin/env python3
"""
Ollama AI Backend Service for SYNEREX
RAG chatbot using qwen2.5vl:32b (GPU machine) + ChromaDB vector store.
Existing /api/ai/chat endpoint signature unchanged — frontend JS unmodified.
"""

import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Optional

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
try:
    CORS(app)
except Exception as e:
    logger.warning(f"CORS init failed (non-critical): {e}")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
OLLAMA_BASE_URL = os.getenv("OLLAMA_LOCAL_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5vl:32b")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
CHROMA_URL = os.getenv("CHROMA_URL", "http://localhost:8100")
COLLECTION_NAME = "synerex_equipment"
INGEST_SECRET = os.getenv("INGEST_SECRET", "synerex-ingest-secret")

SCRIPT_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
KNOWLEDGE_BASE_PATH = SCRIPT_DIR / "knowledge_base"


# ---------------------------------------------------------------------------
# ChromaDB RAG layer
# ---------------------------------------------------------------------------
class ChromaRAG:
    def __init__(self):
        self.collection = None
        self._init_chroma()
        self._migrate_knowledge_base()

    def _init_chroma(self):
        try:
            import chromadb
            host_port = CHROMA_URL.replace("http://", "").replace("https://", "")
            host, port = host_port.split(":")
            client = chromadb.HttpClient(host=host, port=int(port))
            self.collection = client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info(
                f"ChromaDB connected — collection '{COLLECTION_NAME}' "
                f"has {self.collection.count()} chunks"
            )
        except Exception as e:
            logger.error(f"ChromaDB init failed: {e}")
            self.collection = None

    def _embed(self, text: str) -> Optional[list]:
        try:
            resp = requests.post(
                f"{OLLAMA_BASE_URL}/api/embeddings",
                json={"model": OLLAMA_EMBED_MODEL, "prompt": text},
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json().get("embedding")
        except Exception as e:
            logger.warning(f"Embedding failed: {e}")
            return None

    def _chunk_text(self, text: str, size: int = 800, overlap: int = 100) -> list:
        chunks, start = [], 0
        while start < len(text):
            chunks.append(text[start : start + size])
            start += size - overlap
        return [c for c in chunks if c.strip()]

    def _extract_text_from_json(self, data) -> str:
        parts = []
        if isinstance(data, str):
            parts.append(data)
        elif isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, str) and v.strip():
                    parts.append(f"{k}: {v}")
                elif isinstance(v, (dict, list)):
                    parts.append(self._extract_text_from_json(v))
        elif isinstance(data, list):
            for item in data:
                parts.append(self._extract_text_from_json(item))
        return "\n".join(p for p in parts if p and p.strip())

    def _migrate_knowledge_base(self):
        """Auto-migrate existing JSON knowledge base files into ChromaDB (idempotent)."""
        if not self.collection or not KNOWLEDGE_BASE_PATH.exists():
            return
        try:
            json_files = list(KNOWLEDGE_BASE_PATH.rglob("*.json"))
            if not json_files:
                logger.info("No JSON knowledge base files found to migrate")
                return
            migrated = 0
            for json_file in json_files:
                try:
                    data = json.loads(json_file.read_text(encoding="utf-8"))
                    text = self._extract_text_from_json(data)
                    if not text or len(text.strip()) < 50:
                        continue
                    doc_id = f"kb_{json_file.stem}"
                    added = self.ingest_text(
                        text, doc_id, {"source": json_file.name, "type": "knowledge_base"}
                    )
                    if added:
                        migrated += 1
                except Exception as e:
                    logger.warning(f"Failed to migrate {json_file.name}: {e}")
            logger.info(
                f"Knowledge base migration complete: {migrated}/{len(json_files)} files"
            )
        except Exception as e:
            logger.error(f"Knowledge base migration error: {e}")

    def ingest_text(self, text: str, doc_id: str, metadata: dict = None) -> int:
        """Chunk, embed, and upsert text. Returns number of chunks added."""
        if not self.collection:
            return 0
        chunks = self._chunk_text(text)
        added = 0
        for i, chunk in enumerate(chunks):
            embedding = self._embed(chunk)
            if embedding is None:
                continue
            try:
                self.collection.upsert(
                    ids=[f"{doc_id}_chunk_{i}"],
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[{**(metadata or {}), "chunk_index": i, "doc_id": doc_id}],
                )
                added += 1
            except Exception as e:
                logger.warning(f"Upsert failed for {doc_id}_chunk_{i}: {e}")
        return added

    def query(self, question: str, top_k: int = 5) -> list:
        """Semantic search — returns top-k relevant text chunks."""
        if not self.collection:
            return []
        embedding = self._embed(question)
        if not embedding:
            return []
        try:
            count = self.collection.count()
            if count == 0:
                return []
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=min(top_k, count),
            )
            return results.get("documents", [[]])[0]
        except Exception as e:
            logger.warning(f"ChromaDB query failed: {e}")
            return []

    def get_stats(self) -> dict:
        if not self.collection:
            return {"available": False, "chunk_count": 0}
        try:
            return {
                "available": True,
                "chunk_count": self.collection.count(),
                "collection": COLLECTION_NAME,
            }
        except Exception:
            return {"available": False, "chunk_count": 0}

    def delete_doc(self, doc_id: str) -> bool:
        if not self.collection:
            return False
        try:
            results = self.collection.get(where={"doc_id": doc_id})
            if results and results.get("ids"):
                self.collection.delete(ids=results["ids"])
                return True
            return False
        except Exception as e:
            logger.warning(f"Delete failed for {doc_id}: {e}")
            return False


# ---------------------------------------------------------------------------
# AI response generation
# ---------------------------------------------------------------------------
class OllamaAI:
    def __init__(self):
        self.base_url = OLLAMA_BASE_URL
        self.model = OLLAMA_MODEL
        self.rag = ChromaRAG()
        logger.info(f"OllamaAI ready — model={self.model} ollama={self.base_url}")

    def generate_response(
        self,
        question: str,
        project_context: dict = None,
        conversation_history: list = None,
        location_data: dict = None,
    ) -> str:
        try:
            chunks = self.rag.query(question, top_k=5)
            context_text = "\n\n".join(chunks) if chunks else ""

            extra_lines = []
            if project_context:
                name = project_context.get("project_name") or project_context.get(
                    "facility_name", ""
                )
                loc = ", ".join(
                    filter(
                        None,
                        [project_context.get("city", ""), project_context.get("state", "")],
                    )
                )
                if name:
                    extra_lines.append(f"Project: {name}")
                if loc:
                    extra_lines.append(f"Location: {loc}")
            if location_data and location_data.get("cityState"):
                extra_lines.append(f"User location: {location_data['cityState']}")

            system_msg = (
                "You are SynerexAI, an expert assistant for SYNEREX power quality products and analysis. "
                "SYNEREX manufactures power quality equipment — harmonic filters, power factor correction "
                "systems, and voltage regulators. SYNEREX does NOT sell electricity. "
                "Answer based strictly on the provided documentation context. "
                "If the answer is not in the context, say so clearly and offer related help you can provide."
            )

            user_content = ""
            if context_text:
                user_content += f"Documentation context:\n{context_text}\n\n"
            if extra_lines:
                user_content += "\n".join(extra_lines) + "\n\n"
            user_content += f"Question: {question}"

            messages = [{"role": "system", "content": system_msg}]
            if conversation_history:
                for msg in conversation_history[-4:]:
                    role = msg.get("type") or msg.get("role", "user")
                    content = msg.get("message") or msg.get("content", "")
                    if role in ("user", "assistant") and content:
                        messages.append({"role": role, "content": content})
            messages.append({"role": "user", "content": user_content})

            return self._call_ollama_chat(messages)

        except Exception as e:
            logger.error(f"generate_response error: {e}")
            return (
                "I encountered an error while processing your request. "
                f"Please try again. Error: {e}"
            )

    def _call_ollama_chat(self, messages: list, max_tokens: int = 800) -> str:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.4, "num_predict": max_tokens},
        }
        for timeout in [90, 180]:
            try:
                logger.info(f"Calling Ollama chat model={self.model} timeout={timeout}s")
                resp = requests.post(url, json=payload, timeout=timeout)
                resp.raise_for_status()
                content = (resp.json().get("message") or {}).get("content", "").strip()
                if len(content) >= 10:
                    logger.info(f"Ollama response: {len(content)} chars")
                    return content
                logger.warning("Ollama returned very short response, retrying")
            except requests.exceptions.Timeout:
                if timeout == 180:
                    raise Exception("Ollama timed out after 3 minutes")
                logger.warning(f"Ollama timeout at {timeout}s, retrying with 180s")
            except Exception as e:
                raise Exception(f"Ollama API error: {e}")
        return "I was unable to generate a response. Please try again."


# ---------------------------------------------------------------------------
# Initialize
# ---------------------------------------------------------------------------
ollama_ai = OllamaAI()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health_check():
    try:
        ollama_status = "unknown"
        try:
            r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            ollama_status = "healthy" if r.status_code == 200 else "unhealthy"
        except Exception as e:
            ollama_status = f"unavailable: {e}"

        return jsonify({
            "status": "healthy",
            "service": "ollama_ai_backend",
            "ollama_status": ollama_status,
            "model": OLLAMA_MODEL,
            "rag": ollama_ai.rag.get_stats(),
        })
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/api/ai/chat", methods=["POST"])
def chat():
    """Main chat endpoint — unchanged signature, consumed by existing frontend JS."""
    try:
        data = request.get_json()
        if not data or "question" not in data:
            return jsonify({"error": "Missing 'question' field"}), 400

        response = ollama_ai.generate_response(
            question=data["question"],
            project_context=data.get("project_context", {}),
            conversation_history=data.get("conversation_history", []),
            location_data=data.get("location_data"),
        )
        return jsonify({"response": response, "model": OLLAMA_MODEL})
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/knowledge/search", methods=["POST"])
def search_knowledge():
    try:
        data = request.get_json()
        if not data or "query" not in data:
            return jsonify({"error": "Missing 'query' field"}), 400
        chunks = ollama_ai.rag.query(data["query"], top_k=5)
        results = [{"content": c, "score": 1.0} for c in chunks]
        return jsonify({
            "query": data["query"],
            "results": results,
            "total_results": len(results),
        })
    except Exception as e:
        logger.error(f"Knowledge search error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/knowledge/stats", methods=["GET"])
def knowledge_stats():
    return jsonify(ollama_ai.rag.get_stats())


@app.route("/api/ai/knowledge/ingest", methods=["POST"])
def ingest_document():
    """Admin endpoint: upload PDF or TXT to add to the knowledge base."""
    if request.headers.get("X-Ingest-Secret", "") != INGEST_SECRET:
        return jsonify({"error": "Unauthorized"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    doc_name = request.form.get("name") or file.filename or "unknown"
    doc_id = f"upload_{hashlib.md5(doc_name.encode()).hexdigest()[:12]}"

    try:
        content = file.read()
        filename = (file.filename or "").lower()

        if filename.endswith(".pdf"):
            try:
                import fitz
                doc = fitz.open(stream=content, filetype="pdf")
                text = "\n".join(page.get_text() for page in doc)
                doc.close()
            except Exception:
                return jsonify({"error": "Failed to read PDF"}), 400
        else:
            text = content.decode("utf-8", errors="replace")

        if len(text.strip()) < 50:
            return jsonify({"error": "Document appears empty"}), 400

        chunks_added = ollama_ai.rag.ingest_text(
            text, doc_id, {"source": doc_name, "type": "uploaded_document"}
        )
        return jsonify({"success": True, "doc_id": doc_id, "chunks_added": chunks_added})
    except Exception as e:
        logger.error(f"Ingest error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/knowledge/document/<doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    if request.headers.get("X-Ingest-Secret", "") != INGEST_SECRET:
        return jsonify({"error": "Unauthorized"}), 401
    success = ollama_ai.rag.delete_doc(doc_id)
    return jsonify({"success": success})


@app.route("/api/ai/test", methods=["POST"])
def test_ai():
    try:
        response = ollama_ai.generate_response("What SYNEREX products are available?")
        return jsonify({"response": response, "model": OLLAMA_MODEL, "status": "success"})
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 500


if __name__ == "__main__":
    print(f"Starting Ollama AI Backend — model={OLLAMA_MODEL} ollama={OLLAMA_BASE_URL}")
    print(f"ChromaDB: {CHROMA_URL}  embed_model={OLLAMA_EMBED_MODEL}")
    app.run(host="0.0.0.0", port=8090, debug=False, use_reloader=False, threaded=True)
