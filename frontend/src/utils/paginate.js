// Normalizes Laravel paginator responses and legacy bare-array responses
// into { items, meta } so pages can render server-side pagination.
export default function unwrapPaginator(response) {
  const payload = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(payload)) {
    return {
      items: payload,
      meta: {
        currentPage: 1,
        lastPage: 1,
        total: payload.length,
        from: payload.length ? 1 : 0,
        to: payload.length,
      },
    };
  }

  return {
    items: payload.data || [],
    meta: {
      currentPage: payload.current_page || 1,
      lastPage: payload.last_page || 1,
      total: payload.total || 0,
      from: payload.from || 0,
      to: payload.to || 0,
    },
  };
}
