package gr.A4.SmartHouseBuilder.dto.xml;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class StoreXmlItem {

    @JsonProperty("title")
    public String title;

    @JsonProperty("price")
    public Double price;

    @JsonProperty("image_urls")
    public String imageUrls;

    @JsonProperty("description")
    public String description;

    @JsonProperty("aff_code")
    public String affCode;

    @JsonProperty("campaign_name")
    public String campaignName;

}