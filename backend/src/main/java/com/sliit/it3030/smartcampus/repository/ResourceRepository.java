package com.sliit.it3030.smartcampus.repository;

import com.sliit.it3030.smartcampus.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ResourceRepository extends MongoRepository<Resource, String> {
}