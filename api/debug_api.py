from fastapi import FastAPI

app = FastAPI()

@app.get("/api")
async def root():
    return {"message": "Simplified Jazline API is alive!"}

@app.get("/api/{path:path}")
async def catch_all(path: str):
    return {"message": f"Path: {path} is not yet implemented in simplified mode"}
