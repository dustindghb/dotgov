import os
import json
import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import LlamaCpp
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
import chromadb  # Add this import for ChromaDB client settings

load_dotenv()

# Add ChromaDB connection settings
chroma_host = os.getenv('CHROMA_HOST', 'localhost')
chroma_port = os.getenv('CHROMA_PORT', '8000')

# Initialize embeddings and models
if os.getenv('USE_OPENAI', 'true').lower() == 'true':
    embeddings = OpenAIEmbeddings()
    llm = ChatOpenAI(temperature=0.2, model="gpt-3.5-turbo")
else:
    embeddings = HuggingFaceEmbeddings(model_name=os.getenv('EMBEDDING_MODEL'))
    llm = LlamaCpp(
        model_path=os.getenv('LLAMA_MODEL_PATH'),
        temperature=0.2,
        max_tokens=2000,
        n_gpu_layers=-1, 
        n_batch=512,
        verbose=True
    )

chroma_collection_name = os.getenv('COLLECTION_NAME')

# Update ChromaDB connection to use the Docker container
vectorstore = Chroma(
    collection_name=chroma_collection_name,
    embedding_function=embeddings,
    persist_directory="./chroma-data",
    client_settings=chromadb.config.Settings(
        chroma_api_impl="rest",
        chroma_server_host=chroma_host,
        chroma_server_http_port=chroma_port
    )
)

app = FastAPI(title="Federal Register RAG API")

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 10
    filter: Optional[dict] = None

class RuleResult(BaseModel):
    rule_id: str
    title: str
    score: float
    metadata: dict

class QueryResponse(BaseModel):
    query: str
    results: List[RuleResult]

RAG_PROMPT_TEMPLATE = """
You are an expert analyst working with Federal Register proposed rules.
Given the context information about proposed rules and using your knowledge,
answer the question to the best of your ability.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
"""

prompt = PromptTemplate(
    template=RAG_PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    chain_type_kwargs={"prompt": prompt}
)

@app.post("/query", response_model=QueryResponse)
async def query_rules(request: QueryRequest):
    """Query the RAG system for relevant rules"""
    try:
        if request.filter:
            search_filter = request.filter
        else:
            search_filter = {"type": "proposed_rule"}
            
        documents = vectorstore.similarity_search_with_score(
            query=request.query,
            k=request.top_k,
            filter=search_filter
        )
        
        rule_ids = set()
        results = []
        
        for doc, score in documents:
            rule_id = doc.metadata.get("rule_id")
            if rule_id in rule_ids:
                continue
                
            rule_ids.add(rule_id)
            
            results.append(RuleResult(
                rule_id=rule_id,
                title=doc.metadata.get("title", "Untitled Rule"),
                score=float(score),
                metadata=doc.metadata
            ))
            
            if len(results) >= request.top_k:
                break
        
        return QueryResponse(
            query=request.query,
            results=results
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying RAG system: {str(e)}")

@app.post("/analyze")
async def analyze_rule(rule_id: str, query: str):
    """Analyze a rule with the LLM using RAG"""
    try:
        result = qa_chain.invoke({
            "query": f"Regarding rule {rule_id}: {query}"
        })
        
        return {
            "rule_id": rule_id,
            "query": query,
            "analysis": result["result"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing rule: {str(e)}")

@app.post("/process-federal-register")
async def process_federal_register(file_path: str):
    """Process a Federal Register abstracts file"""
    try:
        import subprocess
        
        # Run the Federal Register processor script as a subprocess
        result = subprocess.run(
            ["python", "process_fr_abstracts.py", file_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            try:
                # Try to parse JSON result
                output = json.loads(result.stdout.strip().split('\n')[-1])
                return {
                    "success": True,
                    "processed": output.get("processed_rules", 0),
                    "chunks": output.get("total_chunks", 0)
                }
            except:
                return {
                    "success": True,
                    "message": "Processing completed",
                    "output": result.stdout
                }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing Federal Register abstracts: {result.stderr}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process Federal Register abstracts: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)