// Builds the relative next/previous page URIs for a paginated collection GET.
// `extraQuery` carries any filter params to preserve across pages, already
// URL-encoded and starting with "&" (or empty).
function nextPageUri(string path, string extraQuery, int count, int limitVal, int offsetVal) returns string? {
    int nextOffset = offsetVal + limitVal;
    if nextOffset >= count {
        return ();
    }
    return string `${path}?limit=${limitVal}&offset=${nextOffset}${extraQuery}`;
}

function previousPageUri(string path, string extraQuery, int limitVal, int offsetVal) returns string? {
    if offsetVal <= 0 {
        return ();
    }
    int prevOffset = offsetVal - limitVal;
    if prevOffset < 0 {
        prevOffset = 0;
    }
    return string `${path}?limit=${limitVal}&offset=${prevOffset}${extraQuery}`;
}
