package gr.A4.SmartHouseBuilder.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "layouts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Layout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "devices_id")
    private Integer devicesId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String drawing;

    private Integer rating;
}