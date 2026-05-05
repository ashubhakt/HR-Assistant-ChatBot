package com.ashutosh.HR_Assistant_Chatbot.controller;

import java.util.List;
import java.util.Map;

import org.apache.tika.utils.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ashutosh.HR_Assistant_Chatbot.response.ConversationHistory;
import com.ashutosh.HR_Assistant_Chatbot.response.ConversationWithTitle;
import com.ashutosh.HR_Assistant_Chatbot.service.ChatService;

import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
	private final ChatService chatService;
	public ChatController(ChatService chatService){
		this.chatService = chatService;
	}
	
	@PostMapping("/new")
	public Map<String , String> createConversation(){
		return Map.of("conversationId" , chatService.startConversation());
	}
	
	@PostMapping
	public Flux<String> chat(@RequestParam String conversationId ,
			@RequestParam String userQuery){
		if(StringUtils.isEmpty(conversationId)) {
			conversationId = chatService.startConversation();
		}
		return chatService.retrieveAnswers(conversationId, userQuery);
	}
	
	@GetMapping("/history/{conversationId}")
	public List<ConversationHistory> getConversationHistory(@PathVariable String conversationId){
		return chatService.getConversationHistory(conversationId);
	}
	
	
	@GetMapping("")
	public List<ConversationWithTitle> getConversationIdsWithTitles(){
		return chatService.getConversationIdWithTitle();
	}
	
	@DeleteMapping
	public String deleteConversations(@RequestParam String conversationId) {
		chatService.deleteConversation(conversationId);
		return "Conversation deleted successfully!";
	}

}
