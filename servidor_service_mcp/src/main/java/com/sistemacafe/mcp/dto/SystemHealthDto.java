package com.sistemacafe.mcp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthDto {
    private String status;
    private String mcpProtocol;
    private String transport;
    private Integer toolCount;
    private Boolean backendConnected;
    private String backendUrl;
    private Long timestamp;
    private Map<String, Object> details;
}
