export class InferParams {
  id: number | null = null;
}

export class Filter extends InferParams {
  search: string | null = null;
  year: string = '';
}

export class Pagination extends InferParams {
  pageSize: number = 25;
  pageNumber: number = 0;
  filter: Filter | null = null;
  sortBy: string | null = null;
  sortType: string | null = null;
  tokenData: unknown = null;
}