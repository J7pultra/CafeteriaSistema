package com.sistemacafe.mcp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrewRecipeDto {
    private String method;
    private String roastLevel;
    private Double coffeeGrams;
    private Double waterVolumeMl;
    private String brewRatio;
    private Integer waterTemperatureCelsius;
    private String grindProfile;
    private String totalTimeEstimate;
    private List<String> steps;
    private String baristaTip;
}
