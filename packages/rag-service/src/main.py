from fastapi import FastAPI

app = FastAPI(title="AI Assistant RAG Service", version="0.0.1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "rag-service"}
