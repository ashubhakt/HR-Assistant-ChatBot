package com.ashutosh.HR_Assistant_Chatbot.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.generation.augmentation.ContextualQueryAugmenter;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;

import com.ashutosh.HR_Assistant_Chatbot.response.ConversationHistory;
import com.ashutosh.HR_Assistant_Chatbot.response.ConversationWithTitle;

import org.apache.commons.collections4.CollectionUtils;

import reactor.core.publisher.Flux;

@Service
public class ChatService {

    private final VectorStore vectorStore;
    private final ChatModel chatModel;
    private final ChatMemoryRepository chatMemoryRepository;

    // ✅ No need of TreeMap → HashMap is enough
    private final Map<String, ConversationWithTitle> conversationMap = new HashMap<>();

    public ChatService(VectorStore vectorStore,
                       ChatModel chatModel,
                       ChatMemoryRepository chatMemoryRepository) {
        this.vectorStore = vectorStore;
        this.chatModel = chatModel;
        this.chatMemoryRepository = chatMemoryRepository;
    }

    @Value("classpath:/prompts/rag-system-message.st")
    private Resource ragSystemResource;

    @Value("classpath:/prompts/conversation-titlesy-system-message.st")
    private Resource conversationTitleSystemResource;

    public String startConversation() {
        String conversationId = UUID.randomUUID().toString();
        chatMemoryRepository.saveAll(conversationId, new ArrayList<>());
        return conversationId;
    }

    public Flux<String> retrieveAnswers(String conversationId, String userQuery) {

        RetrievalAugmentationAdvisor retrievalAugmentation =
                RetrievalAugmentationAdvisor.builder()
                        .documentRetriever(
                                VectorStoreDocumentRetriever.builder()
                                        .similarityThreshold(0.50)
                                        .vectorStore(vectorStore)
                                        .build()
                        )
                        .queryAugmenter(
                                ContextualQueryAugmenter.builder()
                                        .allowEmptyContext(true)
                                        .build()
                        )
                        .build();

        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .chatMemoryRepository(chatMemoryRepository)
                .maxMessages(10)
                .build();

        MessageChatMemoryAdvisor chatMemoryAdvisor =
                MessageChatMemoryAdvisor.builder(chatMemory).build();

        ChatClient chatClient = ChatClient.builder(chatModel)
                .defaultAdvisors(chatMemoryAdvisor, retrievalAugmentation)
                .defaultSystem(ragSystemResource)
                .build();

        return chatClient.prompt()
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .user(userQuery)
                .stream()
                .content();
    }

    public List<ConversationHistory> getConversationHistory(String conversationId) {
        List<Message> messages =
                chatMemoryRepository.findByConversationId(conversationId);

        return messages.stream()
                .map(message -> new ConversationHistory(
                        message.getMessageType().getValue(),
                        message.getText()))
                .collect(Collectors.toList());
    }

    public List<ConversationWithTitle> getConversationIdWithTitle() {

        List<String> conversationIds = chatMemoryRepository.findConversationIds();

        for (String id : conversationIds) {
            if (!conversationMap.containsKey(id)
                    || conversationMap.get(id).title() == null
                    || conversationMap.get(id).title().equalsIgnoreCase("New Chat")) {

                conversationMap.put(id,
                        new ConversationWithTitle(
                                id,
                                generateChatConversationTitle(
                                        chatMemoryRepository.findByConversationId(id)
                                )
                        ));
            }
        }

        List<ConversationWithTitle> result =
                new ArrayList<>(conversationMap.values());

        Collections.reverse(result);
        return result;
    }

    private String generateChatConversationTitle(List<Message> messages) {

        if (CollectionUtils.isEmpty(messages)) {
            return "New Chat";
        }

        String conversation = messages.stream()
                .map(m -> m.getMessageType().getValue() + ": " + m.getText())
                .collect(Collectors.joining("\n"));

        return ChatClient.builder(chatModel).build()
                .prompt()
                .system(conversationTitleSystemResource)
                .user("Conversation: " + conversation)
                .call()
                .content();
    }

    public void deleteConversation(String conversationId) {
        chatMemoryRepository.deleteByConversationId(conversationId);

        // ✅ FIXED LINE
        conversationMap.remove(conversationId);
    }
}