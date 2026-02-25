import { NextResponse } from 'next/server'
import { getMenu, searchMenuItems, getMenuCount, getSearchResultCount } from '@/lib/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const search = searchParams.get('search')?.trim()
  const pageSize = 10

  try {
    let items
    let total

    if (search) {
      items = await searchMenuItems(search, page, pageSize)
      total = await getSearchResultCount(search)
    } else {
      items = await getMenu(page, pageSize)
      total = await getMenuCount()
    }

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch menu' },
      { status: 500 },
    )
  }
}

