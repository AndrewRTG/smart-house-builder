package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.ActivityItem;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.ActivityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ActivityController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ActivityService activityService;


    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @Test
    @WithMockUser(username = "alexandra")
    void getMyActivity_AuthenticatedUser_ReturnsOkAndActivityList() throws Exception {

        ActivityItem item = new ActivityItem();


        List<ActivityItem> expectedActivities = List.of(item);

        when(activityService.getActivity("alexandra")).thenReturn(expectedActivities);


        mockMvc.perform(get("/api/v1/activity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1)); // Verificăm că lista primită are un element


        verify(activityService).getActivity("alexandra");
    }

    @Test

    void getMyActivity_UnauthenticatedUser_ReturnsUnauthorized() throws Exception {

        mockMvc.perform(get("/api/v1/activity"))
                .andExpect(status().isUnauthorized()); // Ne așteptăm la 401 Unauthorized conform if-ului tău
    }
}