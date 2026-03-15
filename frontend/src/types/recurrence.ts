/**
 * Mutation scope for recurring event updates/deletes.
 */
export type RecurrenceScope = "this" | "following" | "all";

/**
 * Optional query context for scoped recurring mutations.
 */
export interface EventMutationContext {
  scope?: RecurrenceScope;
  original_start_time?: string;
}