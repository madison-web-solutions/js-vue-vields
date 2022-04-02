import type { MediaItem, LookupResult, UpdateResult } from "@/main";

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
    getAll: (directory: string, extraParams?: object) => Promise<LookupResult<Choosable[]>>,
    search: (directory: string, searchText: string, page?: number, extraParams?: object) => Promise<SearchResultPage<Choosable>>,
    lookup: (directory: string, key: number | string, extraParams?: object) => Promise<LookupResult<Choosable>>,
};

export type LinksProvider = {
    search: (scheme: string, searchText: string, page?: number, extraParams?: object) => Promise<SearchResultPage<LinkAlias>>,
    lookup: (scheme: string, key: string) => Promise<LookupResult<LinkAlias>>,
    schemes: {key: string, label: string}[],
};

export type MediaProvider = {
    search: (searchText?: string, page?: number, extraParams?: object) => Promise<SearchResultPage<MediaItem>>,
    lookup: (key: number | string) => Promise<LookupResult<MediaItem>>,
    upload: (data: FormData, progressCallback: (loaded: number, total: number) => void) => Promise<UpdateResult<MediaItem>>,
    delete: (key: number | string) => Promise<boolean>,
    update: (key: number | string, data: object) => Promise<UpdateResult<MediaItem>>,
};
