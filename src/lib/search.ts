
export type Choosable = {
    key: number | string,
    label: string,
};

export type LinkAlias = {
    scheme: string,
    key: string | number,
    label: string,
    url: string,
};

export type SearchResultPage<T> = {
    page: number,
    hasMore: boolean,
    suggestions: T[],
};

export type ChoicesProvider = {
    getAll: (directory: string, extraParams?: object) => Promise<Choosable[] | null>,
    search: (directory: string, searchText: string, page?: number, extraParams?: object) => Promise<SearchResultPage<Choosable>>,
    lookup: (directory: string, key: number | string, extraParams?: object) => Promise<Choosable | null>,
};

export type LinksProvider = {
    search: (scheme: string, searchText: string, page?: number, extraParams?: object) => Promise<SearchResultPage<LinkAlias>>,
    lookup: (scheme: string, key: string) => Promise<LinkAlias | null>,
    schemes: {key: string, label: string}[],
};

