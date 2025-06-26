from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import base64
import os
import uvicorn
from datetime import datetime
from tempfile import NamedTemporaryFile
import shutil
import subprocess
import platform
import requests
import json

from middleware import setup_cors_middleware

# Load environment variables
load_dotenv()

# Initialize FastAPI and CORS
app = FastAPI()
app = setup_cors_middleware(app)

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Get free API key from https://console.groq.com/
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Models
class CodeDocumentationRequest(BaseModel):
    code: str
    isBase64: bool = False

class GitHubURLRequest(BaseModel):
    github_url: str

class DocumentationResponse(BaseModel):
    markdown: str

# Cross-platform safe directory cleanup
def remove_readonly(func, path, _):
    os.chmod(path, 0o777)
    func(path)

def safe_rmtree(path):
    if platform.system() == "Windows":
        shutil.rmtree(path, onerror=remove_readonly)
    else:
        shutil.rmtree(path)

# Documentation generator using Groq (free Gemma access)
def generate_doc_with_groq(code: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment variables")
    
    prompt = (
        "Generate clear, comprehensive documentation for the following code:\n\n"
        "```\n"
        f"{code}\n"
        "```\n\n"
        "Please include:\n"
        "1. Overview of what the code does\n"
        "2. Detailed description of functions/classes with parameters and return values\n"
        "3. Usage examples where applicable\n"
        "4. Any important notes or considerations\n\n"
        "Format the response in clean, professional Markdown."
    )
    
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "gemma2-9b-it",  # Free Gemma model on Groq
            "messages": [
                {
                    "role": "system", 
                    "content": "You are a professional code documentation assistant. Generate clear, detailed documentation in Markdown format."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "max_tokens": 2048,
            "temperature": 0.3,
            "top_p": 1,
            "stream": False
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Groq API error: {response.text}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Documentation generation error: {str(e)}")

# Routes
@app.get("/")
def root():
    return {"message": "Groq Gemma Documentation API is running."}

@app.post("/docs/gen", response_model=DocumentationResponse)
async def generate_from_code(request: CodeDocumentationRequest):
    try:
        code = base64.b64decode(request.code).decode() if request.isBase64 else request.code
        markdown = generate_doc_with_groq(code)
        return {"markdown": markdown}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/docs/from-upload", response_model=DocumentationResponse)
async def generate_from_upload(file: UploadFile = File(...)):
    try:
        content = await file.read()
        code = content.decode()
        markdown = generate_doc_with_groq(code)
        return {"markdown": markdown}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload error: {str(e)}")

@app.post("/docs/download")
async def download_doc(
    file: Optional[UploadFile] = File(None),
    code: Optional[str] = Form(None),
    isBase64: bool = Form(False)
):
    if file:
        content = await file.read()
        code_str = content.decode()
    elif code:
        code_str = base64.b64decode(code).decode() if isBase64 else code
    else:
        raise HTTPException(status_code=400, detail="No input provided")

    markdown = generate_doc_with_groq(code_str)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"documentation_{timestamp}.md"

    with NamedTemporaryFile(delete=False, mode='w', suffix='.md') as tmp:
        tmp.write(markdown)
        tmp_path = tmp.name

    return FileResponse(
        path=tmp_path,
        filename=filename,
        media_type="text/markdown",
        background=BackgroundTask(lambda: os.remove(tmp_path))
    )

@app.post("/docs/from-github", response_model=DocumentationResponse)
async def generate_from_github(req: GitHubURLRequest):
    try:
        github_url = req.github_url
        if not github_url.startswith("https://github.com/"):
            raise HTTPException(status_code=400, detail="Invalid GitHub URL.")

        folder_name = f"temp_clone_{datetime.now().strftime('%H%M%S')}"
        subprocess.run(["git", "clone", github_url, folder_name], check=True, capture_output=True)

        code = ""
        file_count = 0
        for root, _, files in os.walk(folder_name):
            for f in files:
                if f.endswith((".py", ".js", ".java", ".ts", ".cpp", ".c", ".cs", ".jsx", ".tsx")) and file_count < 8:
                    with open(os.path.join(root, f), 'r', errors="ignore") as file:
                        file_content = file.read()
                        if len(file_content) < 5000:  # Limit file size to avoid token limits
                            code += f"\n\n# File: {f}\n{file_content}"
                            file_count += 1

        markdown = generate_doc_with_groq(code)

        safe_rmtree(folder_name)
        return {"markdown": markdown}

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Git clone error: {e.stderr.decode()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub processing error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)