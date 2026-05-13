package gr.A4.SmartHouseBuilder.service.parser;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ParserFactory {

    private final Map<String, StoreParser> parserRegistry;

    @Autowired
    public ParserFactory(List<StoreParser> availableParsers) {
        this.parserRegistry = availableParsers.stream()
                .collect(Collectors.toMap(
                        parser -> parser.getStoreIdentifier().toUpperCase(),
                        parser -> parser
                ));
    }

    public StoreParser getParserForStore(String storeName) {
        if (storeName == null || storeName.trim().isEmpty()) {
            throw new IllegalArgumentException("Numele magazinului nu poate fi gol!");
        }

        StoreParser parser = parserRegistry.get(storeName.toUpperCase());

        if (parser == null) {
            throw new UnsupportedOperationException("Nu există niciun parser configurat pentru magazinul: " + storeName);
        }

        return parser;
    }
}