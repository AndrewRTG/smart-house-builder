package gr.A4.SmartHouseBuilder.service.parser;

import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import java.io.InputStream;
import java.util.List;

public interface StoreParser {


    String getStoreIdentifier();


    List<DeviceImportDto> parse(InputStream xmlStream);
}