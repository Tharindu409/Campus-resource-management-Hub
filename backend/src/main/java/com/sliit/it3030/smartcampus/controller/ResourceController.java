package com.sliit.it3030.smartcampus.controller;

import com.sliit.it3030.smartcampus.dto.resource.ResourceCreateRequest;
import com.sliit.it3030.smartcampus.dto.resource.ResourceUpdateRequest;
import com.sliit.it3030.smartcampus.model.Resource;
import com.sliit.it3030.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    /**
     * POST /api/resources
     * Create a new resource - ADMIN only
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Resource> createResource(
            @Valid @RequestBody ResourceCreateRequest request) {

        Resource createdResource = resourceService.createResource(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdResource);
    }

    /**
     * GET /api/resources
     * Get all resources with optional filters
     * Example:
     * /api/resources?type=LAB
     * /api/resources?location=Engineering Block
     * /api/resources?minCapacity=30
     * /api/resources?status=ACTIVE
     * /api/resources?q=lab
     */
    @GetMapping
    public ResponseEntity<List<Resource>> getResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q) {

        List<Resource> resources = resourceService.getResources(type, location, minCapacity, status, q);
        return ResponseEntity.ok(resources);
    }

    /**
     * GET /api/resources/{id}
     * Get resource details by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        Resource resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(resource);
    }

    /**
     * PUT /api/resources/{id}
     * Update resource - ADMIN only
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Resource> updateResource(
            @PathVariable String id,
            @Valid @RequestBody ResourceUpdateRequest request) {

        Resource updatedResource = resourceService.updateResource(id, request);
        return ResponseEntity.ok(updatedResource);
    }

    /**
     * DELETE /api/resources/{id}
     * Delete resource - ADMIN only
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}