export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
}

export const SUPPORTED_TIMEZONES: TimezoneOption[] = [
  {
    value: 'Asia/Hong_Kong',
    label: 'Asia/Hong_Kong (UTC+8: HK, SG, Malaysia, China)',
    region: 'Hong Kong',
  },
  {
    value: 'Asia/Bangkok',
    label: 'Asia/Bangkok (UTC+7)',
    region: 'Thailand',
  },
  {
    value: 'Asia/Seoul',
    label: 'Asia/Seoul (UTC+9)',
    region: 'South Korea',
  },
  {
    value: 'Australia/Sydney',
    label: 'Australia/Sydney (UTC+10/+11: Sydney, Melbourne)',
    region: 'Australia',
  },
  {
    value: 'America/New_York',
    label: 'America/New_York (UTC-5/-4: NYC, Toronto)',
    region: 'North America (East)',
  },
  {
    value: 'America/Los_Angeles',
    label: 'America/Los_Angeles (UTC-8/-7: LA, Vancouver)',
    region: 'North America (West)',
  },
];

export const DEFAULT_TIMEZONE = 'Asia/Hong_Kong';