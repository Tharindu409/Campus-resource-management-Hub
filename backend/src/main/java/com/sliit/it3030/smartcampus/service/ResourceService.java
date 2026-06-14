package com.sliit.it3030.smartcampus.service;

import com.sliit.it3030.smartcampus.dto.resource.ResourceCreateRequest;
import com.sliit.it3030.smartcampus.dto.resource.ResourceUpdateRequest;
import com.sliit.it3030.smartcampus.exception.BadRequestException;
import com.sliit.it3030.smartcampus.exception.ResourceNotFoundException;
import com.sliit.it3030.smartcampus.model.Resource;
import com.sliit.it3030.smartcampus.model.ResourceStatus;
import com.sliit.it3030.smartcampus.model.ResourceType;
import com.sliit.it3030.smartcampus.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    private static final Pattern TIME_PATTERN = Pattern.compile("^([01]\\d|2[0-3]):([0-5]\\d)$");

    private static final int GLOBAL_MIN_TIME = toMinutes("06:00");
    private static final int GLOBAL_MAX_TIME = toMinutes("22:00");

    private static final int MIN_DURATION_MINUTES = 30;
    private static final int MAX_DURATION_MINUTES = 12 * 60;

    private static final Map<ResourceType, TimeWindow> TYPE_WINDOWS = Map.of(
            ResourceType.LECTURE_HALL, new TimeWindow("07:00", "20:00"),
            ResourceType.LAB, new TimeWindow("08:00", "18:00"),
            ResourceType.MEETING_ROOM, new TimeWindow("08:00", "17:00"),
            ResourceType.EQUIPMENT, new TimeWindow("06:00", "22:00"));

    // ================= CREATE =================
    public Resource createResource(ResourceCreateRequest request) {

        validateRequiredFields(request.getName(), request.getLocation(), request.getCapacity());

        validateAvailabilityWindow(
                request.getType(),
                request.getAvailableFrom(),
                request.getAvailableTo());

        Resource resource = Resource.builder()
                .name(safeTrim(request.getName()))
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(safeTrim(request.getLocation()))
                .description(safeTrim(request.getDescription()))
                .status(request.getStatus())
                .imageUrl(safeTrim(request.getImageUrl()))
                .availableFrom(request.getAvailableFrom())
                .availableTo(request.getAvailableTo())
                .active(true)
                .build();

        return resourceRepository.save(resource);
    }

    // ================= READ =================
    public List<Resource> getResources(String type, String location, Integer minCapacity, String status, String q) {

        return resourceRepository.findAll().stream()
                .filter(r -> matchesType(r, type))
                .filter(r -> matchesLocation(r, location))
                .filter(r -> matchesMinCapacity(r, minCapacity))
                .filter(r -> matchesStatus(r, status))
                .filter(r -> matchesKeyword(r, q))
                .collect(Collectors.toList());
    }

    public Resource getResourceById(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));
    }

    // ================= UPDATE =================
    public Resource updateResource(String id, ResourceUpdateRequest request) {

        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));

        validateRequiredFields(request.getName(), request.getLocation(), request.getCapacity());

        // ONLY validate time if both are provided
        if (request.getAvailableFrom() != null && request.getAvailableTo() != null) {
            validateAvailabilityWindow(
                    request.getType(),
                    request.getAvailableFrom(),
                    request.getAvailableTo());
        }

        existing.setName(safeTrim(request.getName()));
        existing.setType(request.getType());
        existing.setCapacity(request.getCapacity());
        existing.setLocation(safeTrim(request.getLocation()));
        existing.setDescription(safeTrim(request.getDescription()));
        existing.setStatus(request.getStatus());
        existing.setImageUrl(safeTrim(request.getImageUrl()));
        existing.setAvailableFrom(request.getAvailableFrom());
        existing.setAvailableTo(request.getAvailableTo());

        if (request.getActive() != null) {
            existing.setActive(request.getActive());
        }

        return resourceRepository.save(existing);
    }

    // ================= DELETE =================
    public void deleteResource(String id) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));

        resourceRepository.delete(existing);
    }

    // ================= FILTERS =================
    private boolean matchesType(Resource resource, String type) {
        if (type == null || type.isBlank())
            return true;

        try {
            ResourceType t = ResourceType.valueOf(type.trim().toUpperCase(Locale.ROOT));
            return resource.getType() == t;
        } catch (Exception e) {
            throw new BadRequestException("Invalid resource type: " + type);
        }
    }

    private boolean matchesLocation(Resource resource, String location) {
        if (location == null || location.isBlank())
            return true;

        return resource.getLocation() != null &&
                resource.getLocation().toLowerCase(Locale.ROOT)
                        .contains(location.toLowerCase(Locale.ROOT));
    }

    private boolean matchesMinCapacity(Resource resource, Integer minCapacity) {
        if (minCapacity == null)
            return true;

        if (minCapacity < 0) {
            throw new BadRequestException("minCapacity cannot be negative");
        }

        return resource.getCapacity() != null &&
                resource.getCapacity() >= minCapacity;
    }

    private boolean matchesStatus(Resource resource, String status) {
        if (status == null || status.isBlank())
            return true;

        try {
            ResourceStatus s = ResourceStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            return resource.getStatus() == s;
        } catch (Exception e) {
            throw new BadRequestException("Invalid resource status: " + status);
        }
    }

    private boolean matchesKeyword(Resource resource, String q) {
        if (q == null || q.isBlank())
            return true;

        String k = q.toLowerCase(Locale.ROOT);

        return contains(resource.getName(), k)
                || contains(resource.getLocation(), k)
                || contains(resource.getDescription(), k)
                || (resource.getType() != null &&
                        resource.getType().name().toLowerCase(Locale.ROOT).contains(k));
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }

    // ================= VALIDATION =================
    private void validateAvailabilityWindow(ResourceType type, String from, String to) {

        if ((from == null) != (to == null)) {
            throw new BadRequestException("Both availableFrom and availableTo must be provided together");
        }

        if (from == null && to == null)
            return;

        from = from.trim();
        to = to.trim();

        if (!TIME_PATTERN.matcher(from).matches() || !TIME_PATTERN.matcher(to).matches()) {
            throw new BadRequestException("Time must be in HH:mm format");
        }

        int fromMin = toMinutes(from);
        int toMin = toMinutes(to);

        if (fromMin >= toMin) {
            throw new BadRequestException("availableFrom must be earlier than availableTo");
        }

        int duration = toMin - fromMin;

        if (duration < MIN_DURATION_MINUTES) {
            throw new BadRequestException("Minimum availability is 30 minutes");
        }

        if (duration > MAX_DURATION_MINUTES) {
            throw new BadRequestException("Maximum availability is 12 hours");
        }

        if (fromMin < GLOBAL_MIN_TIME || toMin > GLOBAL_MAX_TIME) {
            throw new BadRequestException("Availability must be between 06:00 and 22:00");
        }

        if (type != null && TYPE_WINDOWS.containsKey(type)) {
            TimeWindow w = TYPE_WINDOWS.get(type);

            int min = toMinutes(w.from());
            int max = toMinutes(w.to());

            if (fromMin < min || toMin > max) {
                throw new BadRequestException(
                        type.name() + " must be between " + w.from() + " and " + w.to());
            }
        }
    }

    // ================= HELPERS =================
    private void validateRequiredFields(String name, String location, Integer capacity) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Name is required");
        }
        if (location == null || location.isBlank()) {
            throw new BadRequestException("Location is required");
        }
        if (capacity == null || capacity < 0) {
            throw new BadRequestException("Capacity must be a positive number");
        }
    }

    private String safeTrim(String value) {
        return value == null ? null : value.trim();
    }

    private static int toMinutes(String time) {
        String[] p = time.split(":");
        return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]);
    }

    private record TimeWindow(String from, String to) {
    }
}