package com.unilost;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * UniLost - Lost and Found platform for university students.
 *
 * This is the main entry point of the Spring Boot application.
 * Run this class to start the backend server on http://localhost:8080
 */
@SpringBootApplication
@EnableScheduling
public class UnilostApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnilostApplication.class, args);
        System.out.println("=======================================");
        System.out.println(" UniLost server started successfully!");
        System.out.println(" Open http://localhost:8080 in your browser");
        System.out.println("=======================================");
    }
}
