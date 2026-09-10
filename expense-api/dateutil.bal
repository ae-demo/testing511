import ballerina/time;

type DateRange record {|
    string 'from;
    string to;
|};

function padTwo(int n) returns string {
    if n < 10 {
        return "0" + n.toString();
    }
    return n.toString();
}

function civilToDateString(time:Civil civil) returns string {
    return string `${civil.year}-${padTwo(civil.month)}-${padTwo(civil.day)}`;
}

function todayDateString() returns string {
    time:Civil nowCivil = time:utcToCivil(time:utcNow());
    return civilToDateString(nowCivil);
}

function dateStringToUtc(string dateStr) returns time:Utc|error {
    return time:utcFromString(dateStr + "T00:00:00.000Z");
}

function addDays(string dateStr, int days) returns string|error {
    time:Utc utc = check dateStringToUtc(dateStr);
    time:Utc shifted = time:utcAddSeconds(utc, <decimal>days * 86400);
    return civilToDateString(time:utcToCivil(shifted));
}

// 0 = Sunday .. 6 = Saturday (time:SUNDAY..time:SATURDAY), Monday = 1.
function dayOfWeekIndex(string dateStr) returns int|error {
    time:Utc utc = check dateStringToUtc(dateStr);
    time:Civil civil = time:utcToCivil(utc);
    time:DayOfWeek? dow = civil.dayOfWeek;
    if dow is () {
        return error("could not determine day of week for " + dateStr);
    }
    return dow;
}

function isValidDateString(string dateStr) returns boolean {
    time:Utc|error result = dateStringToUtc(dateStr);
    return result is time:Utc;
}

// Inclusive [from, to] bounds for the day / ISO calendar week (Mon-Sun) /
// calendar month containing `dateStr`.
function periodBounds(string period, string dateStr) returns DateRange|error {
    if period == "day" {
        return {'from: dateStr, to: dateStr};
    }
    if period == "week" {
        int dow = check dayOfWeekIndex(dateStr);
        int daysSinceMonday = (dow + 6) % 7;
        string monday = check addDays(dateStr, -daysSinceMonday);
        string sunday = check addDays(monday, 6);
        return {'from: monday, to: sunday};
    }
    if period == "month" {
        time:Civil civil = time:utcToCivil(check dateStringToUtc(dateStr));
        string firstDay = string `${civil.year}-${padTwo(civil.month)}-01`;
        string nextMonthFirst = civil.month == 12
            ? string `${civil.year + 1}-01-01`
            : string `${civil.year}-${padTwo(civil.month + 1)}-01`;
        string lastDay = check addDays(nextMonthFirst, -1);
        return {'from: firstDay, to: lastDay};
    }
    return error("invalid period: " + period);
}
