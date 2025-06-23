export const description = "Display current date and time";

export default async (
  _rootDirectory: string,
  args: string[]
): Promise<string> => {
  // Parse arguments to separate flags from custom format
  const flags = args.filter(
    (arg) => arg.startsWith("-") && !arg.startsWith("+")
  );

  // Get current date
  const now = new Date();

  // Check for UTC flag
  const useUtc = flags.includes("-u") || flags.includes("--utc");

  // Check for ISO 8601 flag
  const useIso = flags.includes("-I") || flags.includes("--iso-8601");

  // Handle custom format - need to reconstruct the full format string
  // Find the first argument that starts with '+' and join all subsequent non-flag arguments
  const formatStartIndex = args.findIndex((arg) => arg.startsWith("+"));
  if (formatStartIndex !== -1) {
    // Get the format string starting from the '+' argument
    const formatParts = args.slice(formatStartIndex);
    // Remove flags from the format parts (but keep non-flag arguments)
    const formatPartsFiltered = formatParts.filter(
      (arg) => !arg.startsWith("-") || arg.startsWith("+")
    );
    const formatString = formatPartsFiltered.join(" ").substring(1); // Remove the '+' prefix
    return formatDate(now, formatString, useUtc);
  }

  // Handle ISO 8601 format
  if (useIso) {
    return useUtc
      ? now.toISOString()
      : now.toISOString().replace("Z", formatTimezone(now));
  }

  // Handle UTC format (default style but in UTC)
  if (useUtc) {
    return now.toUTCString();
  }

  // Default format: similar to Unix date command
  // Format: "Wed Dec 25 2024 14:30:25 GMT-0800 (PST)"
  return now.toString();
};

// Helper function to format date with custom format string
function formatDate(date: Date, formatString: string, useUtc: boolean): string {
  const d = useUtc ? date : date;
  const year = useUtc ? d.getUTCFullYear() : d.getFullYear();
  const month = useUtc ? d.getUTCMonth() + 1 : d.getMonth() + 1;
  const day = useUtc ? d.getUTCDate() : d.getDate();
  const hour = useUtc ? d.getUTCHours() : d.getHours();
  const minute = useUtc ? d.getUTCMinutes() : d.getMinutes();
  const second = useUtc ? d.getUTCSeconds() : d.getSeconds();

  // Basic format string support
  let result = formatString;

  // Year formats
  result = result.replace(/%Y/g, year.toString());
  result = result.replace(/%y/g, (year % 100).toString().padStart(2, "0"));

  // Month formats
  result = result.replace(/%m/g, month.toString().padStart(2, "0"));
  result = result.replace(/%b/g, getMonthAbbr(month - 1));
  result = result.replace(/%B/g, getMonthName(month - 1));

  // Day formats
  result = result.replace(/%d/g, day.toString().padStart(2, "0"));
  result = result.replace(/%e/g, day.toString().padStart(2, " "));

  // Time formats
  result = result.replace(/%H/g, hour.toString().padStart(2, "0"));
  result = result.replace(/%I/g, (hour % 12 || 12).toString().padStart(2, "0"));
  result = result.replace(/%M/g, minute.toString().padStart(2, "0"));
  result = result.replace(/%S/g, second.toString().padStart(2, "0"));
  result = result.replace(/%p/g, hour >= 12 ? "PM" : "AM");

  // Weekday formats
  const dayOfWeek = useUtc ? d.getUTCDay() : d.getDay();
  result = result.replace(/%a/g, getWeekdayAbbr(dayOfWeek));
  result = result.replace(/%A/g, getWeekdayName(dayOfWeek));

  // Special characters
  result = result.replace(/%n/g, "\n");
  result = result.replace(/%t/g, "\t");
  result = result.replace(/%%/g, "%");

  return result;
}

// Helper function to get timezone offset string
function formatTimezone(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? "+" : "-";
  return `${sign}${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// Helper functions for month names
function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month];
}

function getMonthAbbr(month: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[month];
}

// Helper functions for weekday names
function getWeekdayName(day: number): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day];
}

function getWeekdayAbbr(day: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[day];
}
