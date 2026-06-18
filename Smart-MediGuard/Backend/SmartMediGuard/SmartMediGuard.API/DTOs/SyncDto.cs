namespace SmartMediGuard.API.DTOs;

public class SyncRequestDto {

    public List<SyncItemDto> Changes { get; set; } = [];
    public DateTime LastSyncAt { get; set; }
}

public class SyncItemDto {

    public string TableName { get; set; } = string.Empty;
    public int RecordId { get; set; }
    public string Action { get; set; } = string.Empty; // INSERT | UPDATE | DELETE
    public string? Data { get; set; } // JSON
}

public class SyncResponseDto {

    public bool Success { get; set; }
    public int ProcessedCount { get; set; }
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
    public string? Message { get; set; }
}