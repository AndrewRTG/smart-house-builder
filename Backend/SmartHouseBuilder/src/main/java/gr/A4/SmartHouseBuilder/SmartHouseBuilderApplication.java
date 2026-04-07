package gr.A4.SmartHouseBuilder;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SmartHouseBuilderApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartHouseBuilderApplication.class, args);
	}
	//da
	/**
	 * definim manual bean-ul ObjectMapper pentru a rezolva eroarea de injectare
	 * din LayoutController si pentru a asigura suportul JSON
	 */
	@Bean
	public ObjectMapper objectMapper() {
		return new ObjectMapper();
	}
}