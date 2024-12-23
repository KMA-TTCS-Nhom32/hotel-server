export interface FindOptions {
  includeDeleted?: boolean;    // Whether to include soft-deleted records
  select?: Record<string, boolean>;    // Which fields to select/return
  include?: Record<string, boolean | Record<string, boolean>>;    // Which relations to include
}
