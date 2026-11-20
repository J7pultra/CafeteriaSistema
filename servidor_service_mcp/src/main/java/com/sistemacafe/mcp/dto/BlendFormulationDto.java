package com.sistemacafe.mcp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlendFormulationDto {
    private String blendName;
    private String suitability;
    private String recommendedRoast;
    private String overallProfile;
    private List<Map<String, Object>> components;
    private String message;
}
