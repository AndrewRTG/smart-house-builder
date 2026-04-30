package gr.A4.SmartHouseBuilder.endpoint.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Setter
@Getter
@Entity
@Table(name = "devices")
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(name = "brand", columnDefinition = "TEXT")
    private String brand;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;
    private String communicationProtocol;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> specifications;

    @Column(name = "best_price")
    private Double bestPrice;

    @Column(name = "best_price_url", columnDefinition = "TEXT")
    private String bestPriceUrl;

    public Device(){}

}
