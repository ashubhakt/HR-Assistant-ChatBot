package com.ashutosh.HR_Assistant_Chatbot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ashutosh.HR_Assistant_Chatbot.entity.UploadedFile;

@Repository
public interface UploadedFileRepository extends JpaRepository<UploadedFile , String>{
	void deleteByDocId(String docId);
}
