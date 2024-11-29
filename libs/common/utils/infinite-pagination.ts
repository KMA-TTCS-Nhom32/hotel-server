export interface TPaginationOptions {
  page: number;
  limit: number;
}

export interface InfinityPaginationResultType<T> {
  data: T[];
  hasNextPage: boolean;
}

export const infinityPagination = <T>(
  data: T[],
  options: TPaginationOptions,
): InfinityPaginationResultType<T> => {
  return {
    data,
    hasNextPage: data.length === options.limit,
  };
};