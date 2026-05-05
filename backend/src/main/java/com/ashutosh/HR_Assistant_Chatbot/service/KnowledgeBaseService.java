package com.ashutosh.HR_Assistant_Chatbot.service;

import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.stereotype.Service;

import com.ashutosh.HR_Assistant_Chatbot.entity.UploadedFile;
import com.ashutosh.HR_Assistant_Chatbot.repository.UploadedFileRepository;
import com.ashutosh.HR_Assistant_Chatbot.util.Documents;

import jakarta.transaction.Transactional;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.document.Document;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class KnowledgeBaseService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseService.class);

    private final VectorStore vectorStore;
    private final ChatModel chatModel;
    private final UploadedFileRepository uploadedFileRepo;

    public KnowledgeBaseService(VectorStore vectorStore,
                                ChatModel chatModel,
                                UploadedFileRepository uploadedFileRepo) {
        this.vectorStore = vectorStore;
        this.chatModel = chatModel;
        this.uploadedFileRepo = uploadedFileRepo;
    }

    // ✅ Internal helper
    private void addDocumentsToVectorStore(List<Document> documents) {
        log.info("Adding {} documents to vector store", documents.size());
        vectorStore.add(documents);
    }

    // ✅ MAIN METHOD (FIXED)
    public void addDocuments(MultipartFile file) {
        try {
            String fileName = file.getOriginalFilename();
            String docId = UUID.randomUUID().toString();

            // 🔒 Validation
            if (fileName == null || file.isEmpty()) {
                throw new RuntimeException("Invalid file uploaded");
            }

            log.info("Processing file: {}", fileName);

            Resource resource = file.getResource();

            // 🔥 Convert PDF → Documents (your RAG pipeline)
            List<Document> documents =
                    Documents.getDocsFromPdf(resource, chatModel, docId, fileName);

            // 🔥 Store embeddings
            addDocumentsToVectorStore(documents);

            // 🔥 Save metadata
            UploadedFile uploadedFile = new UploadedFile();
            uploadedFile.setDocId(docId);
            uploadedFile.setFileName(fileName);
            uploadedFile.setUploadedAt(LocalDateTime.now());

            uploadedFileRepo.save(uploadedFile);

            log.info("Stored metadata for docId: {}", docId);

        } catch (Exception e) {
            log.error("Error while processing document", e);
            throw new RuntimeException("Failed to process document: " + e.getMessage());
        }
    }

    // ✅ Fetch all uploaded files
    public List<UploadedFile> getAllFiles() {
        return uploadedFileRepo.findAll();
    }

    // ✅ Delete document
    @Transactional
    public void deleteDocuments(String docId) {

        // 🔥 Delete from vector DB
        vectorStore.delete(
                new Filter.Expression(
                        Filter.ExpressionType.EQ,
                        new Filter.Key("docId"),
                        new Filter.Value(docId)
                )
        );

        log.info("Deleted from vector store: {}", docId);

        // 🔥 Delete metadata
        uploadedFileRepo.deleteByDocId(docId);

        log.info("Deleted from DB: {}", docId);
    }
}