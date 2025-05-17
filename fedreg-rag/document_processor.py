import os
import json
import boto3
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

load_dotenv()

s3 = boto3.client('s3', region_name=os.getenv('AWS_REGION'))
bucket_name = os.getenv('S3_BUCKET')

if os.getenv('USE_OPENAI', 'true').lower() == 'true':
    embeddings = OpenAIEmbeddings()
else:
    embeddings = HuggingFaceEmbeddings(model_name=os.getenv('EMBEDDING_MODEL'))

chroma_collection_name = os.getenv('COLLECTION_NAME')
vectorstore = Chroma(
    collection_name=chroma_collection_name,
    embedding_function=embeddings,
    persist_directory="./chroma-data"
)

def process_s3_document(key):
    try:
        # Download file from S3
        response = s3.get_object(Bucket=bucket_name, Key=key)
        document_content = response['Body'].read().decode('utf-8')
        data = json.loads(document_content)
        
        rule_id = data.get('ruleId')
        rule_title = data.get('ruleTitle', 'Untitled Rule')
        
        # Extract rule text and metadata
        rule_text = f"Proposed Rule: {rule_title}\n\n"
        
        # If there's document content associated with the rule, add it
        if 'document_content' in data:
            rule_text += data['document_content']
        
        # Create metadata
        metadata = {
            "rule_id": rule_id,
            "title": rule_title,
            "comment_count": data.get('totalCount', 0),
            "type": "proposed_rule"
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
        print(f"Added rule {rule_id} to ChromaDB ({len(documents)} chunks)")
        
        return {"success": True, "rule_id": rule_id, "chunks": len(documents)}
    
    except Exception as e:
        print(f"Error processing document {key}: {str(e)}")
        return {"success": False, "error": str(e)}

def process_all_rules():
    """Process all rules from S3 bucket"""
    # List all rules in the processed-rules folder
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket_name, Prefix='processed-rules/')
    
    processed_count = 0
    error_count = 0
    
    for page in pages:
        if 'Contents' not in page:
            continue
            
        for obj in page['Contents']:
            key = obj['Key']
            if key.endswith('comments.json'):
                result = process_s3_document(key)
                if result['success']:
                    processed_count += 1
                else:
                    error_count += 1
    
    # Persist changes to disk
    vectorstore.persist()
    
    return {
        "processed": processed_count,
        "errors": error_count
    }

if __name__ == "__main__":
    result = process_all_rules()
    print(f"Processing complete. Processed {result['processed']} rules with {result['errors']} errors.")