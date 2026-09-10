function badRequest(string message, string? description = ()) returns ErrorBadRequest {
    return {
        body: {
            code: 400,
            message: message,
            description: description ?: message
        }
    };
}

function notFound(string message) returns ErrorNotFound {
    return {
        body: {
            code: 404,
            message: message
        }
    };
}

function unauthorized() returns ErrorUnauthorized {
    return {
        body: {
            code: 401,
            message: "unauthorized",
            description: "the X-User-Id header is required"
        }
    };
}

// Resolves the gateway-injected caller identity. The header is declared
// OPTIONAL on every resource so a missing value reaches this helper (and
// becomes a 401) instead of the framework's own 400 for a missing required
// header.
function requireUserId(string? userIdHeader) returns string|ErrorUnauthorized {
    if userIdHeader is string && userIdHeader.trim() != "" {
        return userIdHeader;
    }
    return unauthorized();
}
