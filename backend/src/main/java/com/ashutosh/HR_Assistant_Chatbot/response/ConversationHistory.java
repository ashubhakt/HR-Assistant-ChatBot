package com.ashutosh.HR_Assistant_Chatbot.response;

public class ConversationHistory {

    private String messageType;
    private String text;

    // Constructor
    public ConversationHistory(String messageType, String text) {
        this.messageType = messageType;
        this.text = text;
    }

    // Getters
    public String getMessageType() {
        return messageType;
    }

    public String getText() {
        return text;
    }

    // Setters (optional but good practice)
    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }

    public void setText(String text) {
        this.text = text;
    }
}