package com.sliit.it3030.smartcampus.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class UploadService {

    private final Path uploadRootPath;
    private final String appBaseUrl;

    public UploadService(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.base-url:http://localhost:8091}") String appBaseUrl) {
        this.uploadRootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.appBaseUrl = appBaseUrl;
    }

    public String saveResourceImage(MultipartFile file) throws IOException {
        validateImage(file);

        Path resourceUploadPath = uploadRootPath.resolve("resources");
        Files.createDirectories(resourceUploadPath);

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String fileName = UUID.randomUUID() + extension;

        Path targetPath = resourceUploadPath.resolve(fileName).normalize();

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        return appBaseUrl + "/uploads/resources/" + fileName;
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image file");
        }

        String contentType = file.getContentType();
        if (contentType == null ||
                (!contentType.equals("image/jpeg")
                        && !contentType.equals("image/jpg")
                        && !contentType.equals("image/png")
                        && !contentType.equals("image/webp"))) {
            throw new IllegalArgumentException("Only JPG, PNG, and WEBP images are allowed");
        }

        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("Image size must be less than 5MB");
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}