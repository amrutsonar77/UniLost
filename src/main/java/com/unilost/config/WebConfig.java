package com.unilost.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Basic web configuration.
 *
 * 1) Exposes the "uploads" folder (where lost/found item photos are saved)
 *    as a public URL path "/uploads/**" so the browser can display them
 *    in <img> tags.
 *
 * 2) Allows CORS so our plain HTML/JS pages can call the REST API even if
 *    opened from a different port while developing (safe to keep for a
 *    college demo).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }
}
