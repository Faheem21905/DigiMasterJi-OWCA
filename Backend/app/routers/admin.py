"""
Admin Router - Knowledge Base Management
=========================================
Admin endpoints for managing the RAG knowledge base.

DigiMasterJi - Multilingual AI Tutor for Rural Education
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from typing import List, Optional
import logging
from app.models.knowledge_base import (
    SubjectEnum,
    LanguageEnum,
    DocumentUploadResponse,
    VectorSearchRequest,
    VectorSearchResult
)
from app.database import knowledge_base as kb_db
from app.services.rag_service import rag_service
from app.utils.security import get_current_user

# Configure logging for admin operations
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    summary="Upload PDF for RAG ingestion",
    description="Upload a PDF document to be parsed, chunked, and stored in the vector database."
)
async def upload_document(
    file: UploadFile = File(..., description="PDF file to upload"),
    subject: SubjectEnum = Form(..., description="Subject category"),
    language: LanguageEnum = Form(default=LanguageEnum.ENGLISH, description="Document language"),
    tags: Optional[str] = Form(default="", description="Comma-separated tags"),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload and process a PDF document for RAG.
    
    This endpoint:
    1. Validates the uploaded file is a PDF
    2. Extracts text from the PDF
    3. Chunks the text into ~500 token segments with overlap
    4. Generates vector embeddings for each chunk
    5. Stores chunks in MongoDB with vector embeddings
    
    Requires JWT authentication.
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
    
    # Read file content
    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading file: {str(e)}"
        )
    
    if len(pdf_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded"
        )
    
    # Parse tags
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    
    try:
        logger.info(f"[RAG UPLOAD] Processing PDF: {file.filename} (subject: {subject.value}, language: {language.value})")
        
        # Process PDF: extract, chunk, embed
        documents = rag_service.process_pdf(
            pdf_bytes=pdf_bytes,
            filename=file.filename,
            subject=subject.value,
            language=language.value,
            tags=tag_list
        )
        
        if not documents:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No content could be extracted from the PDF"
            )
        
        logger.info(f"[RAG UPLOAD] Created {len(documents)} chunks from PDF, storing in knowledge_base collection...")
        
        # Store in database
        inserted_ids = await kb_db.insert_many_knowledge_chunks(documents)
        
        logger.info(f"[RAG UPLOAD] Successfully stored {len(inserted_ids)} chunks in knowledge_base collection")
        
        return DocumentUploadResponse(
            success=True,
            message=f"Successfully processed and stored {len(inserted_ids)} chunks",
            filename=file.filename,
            chunks_processed=len(inserted_ids),
            subject=subject.value,
            language=language.value
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )


@router.post(
    "/search",
    response_model=List[VectorSearchResult],
    summary="Vector search in knowledge base",
    description="Perform semantic search in the knowledge base using vector similarity."
)
async def search_knowledge_base(
    request: VectorSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Search the knowledge base using vector similarity.
    
    This endpoint:
    1. Generates an embedding for the query text
    2. Performs vector search in MongoDB Atlas
    3. Returns the most relevant chunks with similarity scores
    """
    try:
        # Generate embedding for the query
        query_embedding = rag_service.generate_embedding(request.query)
        
        # Perform vector search
        results = await kb_db.vector_search(
            query_embedding=query_embedding,
            limit=request.limit,
            subject=request.subject.value if request.subject else None,
            language=request.language.value if request.language else None
        )
        
        # Convert to response format
        return [
            VectorSearchResult(
                id=r["_id"],
                title=r["title"],
                content_chunk=r["content_chunk"],
                subject=r["subject"],
                language=r["language"],
                score=r["score"],
                tags=r.get("tags", [])
            )
            for r in results
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search error: {str(e)}"
        )


@router.get(
    "/documents",
    summary="List all uploaded documents",
    description="Get a summary of all uploaded source files in the knowledge base."
)
async def list_documents(
    current_user: dict = Depends(get_current_user)
):
    """List all uploaded documents with their chunk counts."""
    try:
        documents = await kb_db.get_all_source_files()
        return {
            "success": True,
            "documents": documents,
            "total": len(documents)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching documents: {str(e)}"
        )


@router.get(
    "/stats",
    summary="Knowledge base statistics",
    description="Get statistics about the knowledge base."
)
async def get_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get knowledge base statistics."""
    try:
        stats = await kb_db.get_knowledge_base_stats()
        return {
            "success": True,
            **stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stats: {str(e)}"
        )


@router.delete(
    "/documents/{filename}",
    summary="Delete document by filename",
    description="Delete all chunks from a specific source file."
)
async def delete_document(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete all chunks from a specific source file."""
    try:
        deleted_count = await kb_db.delete_chunks_by_source_file(filename)
        
        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No document found with filename: {filename}"
            )
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} chunks",
            "filename": filename,
            "chunks_deleted": deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )


@router.get(
    "/rag-info",
    summary="RAG service information",
    description="Get information about the RAG service configuration."
)
async def get_rag_info(
    current_user: dict = Depends(get_current_user)
):
    """Get RAG service configuration info."""
    return {
        "success": True,
        **rag_service.get_info()
    }
