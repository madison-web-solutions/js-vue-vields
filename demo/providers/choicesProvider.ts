import type { ChoicesProvider } from 'vue-fields-ms'

export const choicesProvider: ChoicesProvider = {
  async getAll(directory, _extraParams) {
    const resp = await fetch(`/api/choices/${encodeURIComponent(directory)}`)
    return resp.json()
  },

  async search(directory, searchText, page = 1, _extraParams) {
    const params = new URLSearchParams({
      search: searchText,
      page: String(page),
    })
    const resp = await fetch(`/api/choices/${encodeURIComponent(directory)}?${params}`)
    return resp.json()
  },

  async lookup(directory, key, _extraParams) {
    const params = new URLSearchParams({ key: String(key) })
    const resp = await fetch(`/api/choices/${encodeURIComponent(directory)}?${params}`)
    return resp.json()
  },
}
