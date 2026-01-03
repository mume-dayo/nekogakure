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

    // 画像の拡張子リスト
    const extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif'];

    for (const ext of extensions) {
        // context.next() で静的ファイルを取得してみる
        const imageResponse = await context.next(new Request(`${url.origin}/images/${imageId}.${ext}`));
        if (imageResponse.ok) {
            return imageResponse;
        }
    }

    return new Response('Image not found', { status: 404 });
};

export const config = {
    path: "/*"
};
