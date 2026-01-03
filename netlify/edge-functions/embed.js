export default async (request, context) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // アセットはそのまま通す
    if (pathname.startsWith('/images/') || (pathname.includes('.') && pathname !== '/')) {
        return context.next();
    }

    // ルートパスは 'index' として処理、それ以外は画像ID
    const imageId = pathname === '/' ? 'index' : pathname.slice(1);

    if (!imageId) {
        return context.next();
    }

    // 画像の拡張子を検出するため、実際にファイルが存在するか確認
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let imageUrl = null;
    let contentType = 'image/jpeg';

    const baseUrl = url.origin;

    for (const ext of extensions) {
        const testUrl = `${baseUrl}/images/${imageId}.${ext}`;
        try {
            const res = await fetch(testUrl, { method: 'HEAD' });
            if (res.ok) {
                imageUrl = testUrl;
                contentType = res.headers.get('content-type') || `image/${ext}`;
                break;
            }
        } catch (e) {
            // 継続
        }
    }

    if (!imageUrl) {
        return new Response('Image not found', { status: 404 });
    }

    // User-Agentでボットかどうか判定
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /bot|discord|telegram|twitter|facebook|slack|whatsapp|crawler|spider/i.test(userAgent);

    if (isBot) {
        // ボット向け: OGPメタタグ付きHTMLを返す
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta property="og:title" content="${imageId}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${imageUrl}">
</head>
<body></body>
</html>`;

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } else {
        // 一般ユーザー向け: 画像に直接リダイレクト
        return Response.redirect(imageUrl, 302);
    }
};

export const config = {
    path: "/*"
};
