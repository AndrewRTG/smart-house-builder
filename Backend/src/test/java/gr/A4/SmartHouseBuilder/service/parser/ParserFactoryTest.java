package gr.A4.SmartHouseBuilder.service.parser;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ParserFactoryTest {

    private ParserFactory parserFactory;

    @BeforeEach
    void setUp() {
        // Creăm lista de parsere pe care Factory-ul o așteaptă în constructor
        List<StoreParser> availableParsers = Arrays.asList(
                new RovisionParser(),
                new VonMagParser(),
                new CaseSmartParser()
        );

        // Injectăm lista manual în constructor
        parserFactory = new ParserFactory(availableParsers);
    }

    @Test
    void testGetParserForStore_ReturnsRovisionParser() {
        // Folosim numele corect al metodei: getParserForStore
        StoreParser parser = parserFactory.getParserForStore("ROVISION");

        assertNotNull(parser);
        assertTrue(parser instanceof RovisionParser);
    }

    @Test
    void testGetParserForStore_ReturnsVonMagParser() {
        StoreParser parser = parserFactory.getParserForStore("VONMAG");

        assertNotNull(parser);
        assertTrue(parser instanceof VonMagParser);
    }

    @Test
    void testGetParserForStore_ReturnsCaseSmartParser() {
        StoreParser parser = parserFactory.getParserForStore("CASESMART");

        assertNotNull(parser);
        assertTrue(parser instanceof CaseSmartParser);
    }

    @Test
    void testGetParserForStore_EmptyName_ThrowsIllegalArgumentException() {
        // Testăm validarea pentru nume gol (conține logică de if)
        assertThrows(IllegalArgumentException.class, () -> {
            parserFactory.getParserForStore("");
        });
    }

    @Test
    void testGetParserForStore_UnknownStore_ThrowsUnsupportedOperationException() {
        // Testăm eroarea pentru magazin inexistent (aruncă UnsupportedOperationException conform codului tău)
        assertThrows(UnsupportedOperationException.class, () -> {
            parserFactory.getParserForStore("MAGAZIN_FANTOMA");
        });
    }
}