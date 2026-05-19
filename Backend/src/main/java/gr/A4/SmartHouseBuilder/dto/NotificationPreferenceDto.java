package gr.A4.SmartHouseBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceDto {
    private boolean emailOnComment;
    private boolean emailOnReply;
    private boolean emailOnLike;
    private boolean emailOnWishlist;
}
