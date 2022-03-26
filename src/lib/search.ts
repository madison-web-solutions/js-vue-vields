
export type Choosable = {
    key: number | string,
    label: string,
};

export type ChoiceList = Choosable[];

export type ChoiceListProvider = {
    get: (directory: string, extraParams?: object) => Promise<ChoiceList | null>,
}

export type SearchResultPage = {
    page: number,
    hasMore: boolean,
    suggestions: ChoiceList,
};

export type SearchProvider = {
    lookup: (directory: string, id: number | string, extraParams?: object) => Promise<Choosable | null>,
    search: (directory: string, searchText: string, page?: number, extraParams?: object) => Promise<SearchResultPage>,
};

