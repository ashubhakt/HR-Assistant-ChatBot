package com.ashutosh.HR_Assistant_Chatbot.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "uploaded_files") // fixed naming (hyphen can cause issues)
public class UploadedFile {

    @Id
    private String docId;

    private String fileName;

    private LocalDateTime uploadedAt;

    // Default constructor (required by JPA)
    public UploadedFile() {
    }

    // Parameterized constructor
    public UploadedFile(String docId, String fileName, LocalDateTime uploadedAt) {
        this.docId = docId;
        this.fileName = fileName;
        this.uploadedAt = uploadedAt;
    }

    // Getters
    public String getDocId() {
        return docId;
    }

    public String getFileName() {
        return fileName;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    // Setters
    public void setDocId(String docId) {
        this.docId = docId;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}