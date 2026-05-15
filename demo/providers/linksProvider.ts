import type { LinksProvider } from 'vue-fields-ms'

export const linksProvider: LinksProvider = {
  schemes: [
    { key: 'page', label: 'Page' },
    { key: 'post', label: 'Post' },
    { key: 'url', label: 'External URL' },
  ],

  async search(scheme, searchText, page = 1, _extraParams) {
    const params = new URLSearchParams({
      scheme,
      q: searchText,
      page: String(page),
    })
    const resp = await fetch(`/api/links/search?${params}`)
    return resp.json()
  },

  async lookup(scheme, key) {
    const params = new URLSearchParams({ scheme, key })
    const resp = await fetch(`/api/links/lookup?${params}`)
    return resp.json()
  },
}
