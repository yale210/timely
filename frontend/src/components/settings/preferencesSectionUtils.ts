const dayLabels: [number, string][] = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [7, "Sun"],
];

const getTimezoneOptions = (): string[] => {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }

  return [
    "UTC",
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
};

const buildDefaultSchedule = (start: string, end: string) =>
  dayLabels.map(([day]) => ({ day, start, end }));

export { buildDefaultSchedule, dayLabels, getTimezoneOptions };
