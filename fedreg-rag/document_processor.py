import os
import json
import sys
import boto3
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
import chromadb  # Add this import for ChromaDB client settings

load_dotenv()

# Initialize AWS S3 client
s3 = boto3.client('s3', region_name=os.getenv('AWS_REGION'))
bucket_name = os.getenv('S3_BUCKET')

# Add ChromaDB connection settings
chroma_host = os.getenv('CHROMA_HOST', 'localhost')
chroma_port = os.getenv('CHROMA_PORT', '8000')

# Use the same embeddings setup as your existing code
if os.getenv('USE_OPENAI', 'true').lower() == 'true':
    embeddings = OpenAIEmbeddings()
else:
    embeddings = HuggingFaceEmbeddings(model_name=os.getenv('EMBEDDING_MODEL'))

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

def process_federal_register_abstracts(s3_key):
    """Process Federal Register abstracts from a JSON file stored in S3"""
    try:
        print(f"Starting to process Federal Register abstracts from {s3_key}")
        
        # Download file from S3
        response = s3.get_object(Bucket=bucket_name, Key=s3_key)
        file_content = response['Body'].read().decode('utf-8')
        rules = json.loads(file_content)
        
        processed_count = 0
        chunk_count = 0
        
        # Process each rule in the file
        for rule in rules:
            rule_id = rule.get('id', f"unknown-{processed_count}")
            rule_title = rule.get('title', 'Untitled Rule')
            
            # Skip if no abstract
            if not rule.get('abstract'):
                print(f"Skipping rule {rule_id} - no abstract available")
                continue
                
            # Format rule text with metadata
            rule_text = f"Proposed Rule: {rule_title}\n\n"
            rule_text += rule.get('abstract', '')
            
            # Create metadata
            metadata = {
                "rule_id": rule_id,
                "title": rule_title,
                "publication_date": rule.get('publication_date', 'Unknown'),
                "type": rule.get('type', 'Proposed Rule'),
                "agencies": [a.get('name', a.get('raw_name', 'Unknown Agency')) 
                            for a in rule.get('agencies', [])] 
                            if isinstance(rule.get('agencies', []), list) else [],
                "html_url": rule.get('html_url', ''),
                "pdf_url": rule.get('pdf_url', '')
            }
            
            # Split text into manageable chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=100
            )
            chunks = text_splitter.split_text(rule_text)
            
            # Create documents with metadata
            documents = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = metadata.copy()
                chunk_metadata["chunk_id"] = i
                documents.append((chunk, chunk_metadata))
            
            # Add documents to ChromaDB
            texts = [doc[0] for doc in documents]
            metadatas = [doc[1] for doc in documents]
            ids = [f"{rule_id}-chunk-{i}" for i in range(len(documents))]
            
            vectorstore.add_texts(texts=texts, metadatas=metadatas, ids=ids)
            
            processed_count += 1
            chunk_count += len(documents)
            
            if processed_count % 10 == 0:
                print(f"Processed {processed_count} rules ({chunk_count} chunks) so far")
        
        # Persist changes to disk
        vectorstore.persist()
        
        print(f"Processing complete. Added {processed_count} rules with {chunk_count} total chunks")
        return {
            "success": True,
            "processed_rules": processed_count,
            "total_chunks": chunk_count
        }
        
    except Exception as e:
        import traceback
        print(f"Error processing file {s3_key}: {str(e)}")
        print(traceback.format_exc())
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        s3_key = sys.argv[1]
        print(f"Processing file: {s3_key}")
        result = process_federal_register_abstracts(s3_key)
        print(json.dumps(result, indent=2))
    else:
        print("No file path provided. Usage: python process_fr_abstracts.py <s3_key>")
        sys.exit(1)