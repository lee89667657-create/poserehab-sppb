import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error: '네이버 API 키가 설정되지 않았습니다. .env.local에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 추가하세요.',
      },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const display = searchParams.get('display') || '15'
  const sort = searchParams.get('sort') || 'comment'

  if (!query) {
    return NextResponse.json(
      { error: '검색어를 입력하세요.' },
      { status: 400 }
    )
  }

  try {
    const url = new URL('https://openapi.naver.com/v1/search/local.json')
    url.searchParams.set('query', query)
    url.searchParams.set('display', display)
    url.searchParams.set('sort', sort)

    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `네이버 API 오류: ${response.status}`, detail: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `서버 오류: ${message}` },
      { status: 500 }
    )
  }
}
