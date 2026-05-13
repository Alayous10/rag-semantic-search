import os
import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Langchain & GenAI
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain

load_dotenv()

app = FastAPI(title="Semantic Document Search Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
CHROMA_PATH = "./chroma_db"
UPLOAD_DIR = "./uploaded_docs"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Ensure API Key exists
api_key = os.getenv("GEMINI_API_KEY")
if not api_key or api_key == "your_api_key_here":
    print("WARNING: GEMINI_API_KEY not properly set in .env")

# Initialize Embeddings and LLM
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2, google_api_key=api_key, convert_system_message_to_human=True)

# Initialize Chroma Vector Store
vector_store = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Load Document
    ext = file.filename.split('.')[-1].lower()
    if ext == 'pdf':
        loader = PyPDFLoader(file_path)
    elif ext == 'txt':
        loader = TextLoader(file_path, encoding='utf-8')
    elif ext in ['doc', 'docx']:
        loader = Docx2txtLoader(file_path)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    try:
        documents = loader.load()
        # Split text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)
        
        # Save to Chroma
        vector_store.add_documents(chunks)
        vector_store.persist()
        
        return {"message": "File uploaded and processed successfully", "chunks": len(chunks)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    
    system_prompt = (
        "You are an intelligent assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer the question. "
        "If you don't know the answer, say that you don't know based on the provided document. "
        "CRITICAL INSTRUCTION: You MUST answer the question in the EXACT SAME LANGUAGE the user used to ask the question. "
        "If the user asks in English, your entire response must be in English. "
        "If the user asks in Arabic, your entire response must be in Arabic. "
        "Use formatting (markdown) to make your response easy to read."
        "\n\n"
        "{context}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])
    
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    try:
        response = rag_chain.invoke({"input": request.message})
        answer = response["answer"]
        
        # Sources extraction removed as per user request.
            
        return ChatResponse(reply=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
