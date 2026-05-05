package com.ashutosh.HR_Assistant_Chatbot.util;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.model.transformer.KeywordMetadataEnricher;
import org.springframework.ai.model.transformer.SummaryMetadataEnricher;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.core.io.Resource;
import java.util.List;
import java.util.stream.Collectors;

public class Documents {
	public static List<Document> getDocsFromPdf(Resource pdfResource,
			ChatModel chatModel,
			String docId ,
			String fileName){
		
		//step1: To extract the raw text
		TikaDocumentReader tikaReader = new TikaDocumentReader(pdfResource);
		List<Document> rawDocs = tikaReader.read();
		
		//step2: Split by tokens
		List<Document> docsAfterSplit = splitDocs(rawDocs);
		
		//step3 : add metadata(docId + filename)
		List<Document> docsWithMetaData=
				enrichMetaDataWithDocDetails(docId , fileName , docsAfterSplit);
		//step4 : Enrich with Keywords
		List<Document> keyWordEnriched = 
		enrichMetaDataWithKeyWords(chatModel,docsWithMetaData);
		//step5: enrich with summaries
		return enrichMetaDataWithSummaries(chatModel , keyWordEnriched);
		
		
	}
	
	private static List<Document> enrichMetaDataWithDocDetails(String docId, String fileName, List<Document> docsAfterSplit) {
		return docsAfterSplit.stream()
		.peek(docs ->{
			docs.getMetadata().put("docId" ,docId);
			docs.getMetadata().put("source" ,fileName);
		}).collect(Collectors.toList());
		
	}

	private static List<Document> enrichMetaDataWithSummaries(
	        ChatModel chatModel,
	        List<Document> keyWordEnriched) {

	    return new SummaryMetadataEnricher(chatModel,
	            List.of(SummaryMetadataEnricher.SummaryType.CURRENT))
	            .apply(keyWordEnriched);
	}

	private static List<Document> enrichMetaDataWithKeyWords(ChatModel chatModel,
			List<Document> docsAfterSplit) {
		return KeywordMetadataEnricher.builder(chatModel)
				.keywordCount(5)
				.build()
				.apply(docsAfterSplit);
	}

	private static List<Document> splitDocs(List<Document> rawDocs){
		TokenTextSplitter splitter = new TokenTextSplitter();
		return splitter.apply(rawDocs);
	}
}
