/**
 * Represents a special date override that blocks scheduling.
 * @interface SpecialDate
 */
export interface SpecialDate {
  id: number;
  date: string;
  text: string;
}