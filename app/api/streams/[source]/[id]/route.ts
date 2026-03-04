import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'https://zicotv.cc/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ source: string; id: string }> }
) {
  const { source, id } = await params

  try {
    const res = await fetch(`${API_BASE}/streams/${source}/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { available: false, streams: [] },
        { status: 200 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching streams:', error)
    return NextResponse.json(
      { available: false, streams: [] },
      { status: 200 }
    )
  }
}
