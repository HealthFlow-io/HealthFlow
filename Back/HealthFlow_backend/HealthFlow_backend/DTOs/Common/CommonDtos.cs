namespace HealthFlow_backend.DTOs.Common;

public record ApiResponse<T>(
    T Data,
    string? Message,
    bool Success = true
);

public record PaginatedResponse<T>(
    List<T> Data,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasNextPage,
    bool HasPreviousPage
);

public record ApiError(
    string Message,
    Dictionary<string, string[]>? Errors,
    int StatusCode
);

public record FileUploadResponse(
    Guid Id,
    string FileName,
    string Url
);
