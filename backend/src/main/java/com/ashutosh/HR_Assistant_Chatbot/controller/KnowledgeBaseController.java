package com.ashutosh.HR_Assistant_Chatbot.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ashutosh.HR_Assistant_Chatbot.entity.UploadedFile;
import com.ashutosh.HR_Assistant_Chatbot.service.KnowledgeBaseService;

import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/knowledgebase")
@AllArgsConstructor
public class KnowledgeBaseController {
	
	private final KnowledgeBaseService knowledgeBaseService;
	public KnowledgeBaseController(KnowledgeBaseService knowledgeBaseService) {
		this.knowledgeBaseService = knowledgeBaseService;
	}
	
	@PostMapping
	public String basicTraining(@RequestParam("file") MultipartFile file) {
	    knowledgeBaseService.addDocuments(file);
	    return "document added successfully";
	}
	@GetMapping
	public List<UploadedFile> getAllFiles(){
		return knowledgeBaseService.getAllFiles();
	}
	
	@DeleteMapping
	public String deleteFile(@RequestParam("docId") String docId) {
		knowledgeBaseService.deleteDocuments(docId);
		return"document deleted successfully";
	}
}
